# Stock Analysis Pipeline

How the app assembles a complete per-stock data snapshot in Redux and ships it to the AI analysis endpoint.

## Overview

The chatbot (`src/features/Chatbot/`) answers questions about the currently selected stock. To do that it needs *everything* the app knows about that stock in one object: prices, card metrics, company profile, financials, news + AI insights, and all five technical analytics (rolling stats, moving averages, RSI, KDJ, mean reversion).

That object is `state.analysis.snapshots[symbol]`, and four files cooperate to build it:

| File | Role |
|---|---|
| `src/features/analysisSlice.ts` | **Destination** — Redux slice holding one `ISecuritySnapshot` per symbol |
| `src/features/Card/query.ts` + `src/features/Chart/query.ts` | **Source** — query-option builders that define how each dataset is fetched and cached |
| `src/app/querySync.ts` | **Bridge** — mirrors every successful TanStack query into the slice |
| `src/features/Chatbot/buildSnapshot.ts` | **Gap-filler** — forces the snapshot to completeness right before sending |

```
Components render                          Chatbot "ask" clicked
  hooks fetch via query.ts                   ensureCompleteSnapshot()
        │                                      ensureQueryData × 10
        ▼                                          │ (cache hit → instant,
   TanStack QueryCache  ◄──────────────────────────┘  miss → fetch)
        │  "updated"/"success" events
        ▼
   querySync.ts  ──  mergeSnapshot({ symbol, data })
        │
        ▼
   state.analysis.snapshots[symbol]  ──►  POST /api/analysis/stream
```

## The slice — `analysisSlice.ts`

```ts
state.analysis.snapshots: Record<string, ISecuritySnapshot>
```

`ISecuritySnapshot` has one optional field per dataset (`prices`, `metrics`, `profile`, `financials`, `news`, `newsInsights`, `rollingStats`, `movingAverage`, `rsi`, `kdj`, `meanReversion`). All fields are optional because datasets arrive independently, in any order.

There is a single action, `mergeSnapshot({ symbol, data })`, which **shallow-merges** a partial update into that symbol's snapshot. Ten fetches for TSLA produce ten small merges that accumulate into one complete snapshot.

The field types are imported (type-only) from the `query.ts` files, so the Redux mirror and the query cache always describe data with the same shapes. The import direction is one-way (slice ← query files), so there is no circular dependency.

> `redux-logger` is configured in `src/app/store.ts` with a predicate that skips all `analysis/*` actions — the payloads are whole datasets and would flood the console.

## The source — query-option builders in `Card/query.ts` and `Chart/query.ts`

Every dataset has an exported options builder, e.g.:

```ts
rsiQueryOptions(symbol, start, end, interval, window, dataPoints)
// → { queryKey: ["rsi", symbol, start, end, interval, window],
//     queryFn: () => apiPost("/api/analytics/rsi", { dataPoints, window }) }
```

Builders pin down two contracts the rest of the pipeline relies on:

1. **Key layout: `[kind, symbol, ...rest]`.** The dataset kind is at `queryKey[0]` and the symbol at `queryKey[1]` — this is what `querySync` pattern-matches on.
2. **Self-contained `queryFn`.** Everything needed to fetch is baked in at build time (including the `dataPoints` POST body for the four windowed analytics), so the same options work mounted in a component *and* called imperatively.

The hooks (`useGetRSI`, `useGetProfile`, …) are thin wrappers: read `start/end/interval` from the form slice (plus `chart.data` for the analytics ones) and `useQuery(builder(...))`.

The analytics builders use the widget **default windows** (rolling 10, MA 5, RSI 14, KDJ 9), matching what the views fetch — so widget fetches and snapshot fetches share cache entries.

## The bridge — `querySync.ts`

`startQuerySync(queryClient)` is called once in `main.tsx`, before React renders. It subscribes to the `QueryCache` — TanStack's app-wide event bus — and on every event:

1. **Filter**: keep only `event.type === "updated"` **and** `event.action.type === "success"` — the exact moment fresh data lands. (Fetch-started, error, invalidate, etc. also emit `updated` but are dropped.)
2. **Destructure**: `[kind, symbol] = event.query.queryKey`, with type guards that also skip non-conforming keys (e.g. `["suggestions", ...]`).
3. **Translate**: `KEY_TO_FIELD` maps the kind to a snapshot field (`"chart"` → `prices`, `"news-insights"` → `newsInsights`, …). The map is both whitelist and translation table — adding a new dataset to the snapshot is one new entry.
4. **Dispatch**: `mergeSnapshot({ symbol, data: { [field]: event.query.state.data } })` on the imported store singleton (this runs outside React).

Because it listens at the cache level, no component knows the mirroring exists — a card fetching prices, the RSI widget fetching RSI, and the chatbot's gap-filling fetches all feed the snapshot the same way. This is also the v5-friendly replacement for the removed per-query `onSuccess` callback.

`querySync` never fetches, never reads Redux, and never de-duplicates: a refetch simply overwrites the field, which is exactly the "latest known data" semantic the snapshot wants. Since both stores treat the objects as immutable, the mirror shares references with the query cache and costs almost no extra memory.

### The one non-query dataset: card metrics

Annualised return/volatility/Sharpe are computed client-side (`src/features/Card/metrics.ts`) and never pass through TanStack Query. `CardView` dispatches them into the slice directly via a `useEffect`.

## The gap-filler — `buildSnapshot.ts`

Passive mirroring leaves holes: only 2 of the 4 analytics widgets are mounted at a time, and news insights load lazily. So before sending, the chatbot calls:

```ts
await ensureCompleteSnapshot(queryClient, symbol, form)
```

which:

1. **Fetches prices first, mandatorily** — `await ensureQueryData(chartQueryOptions(...))`. This one may throw: without prices there is nothing to analyse, and the analytics endpoints need them as their POST body.
2. **Fills everything else best-effort** — the remaining nine datasets run under `Promise.allSettled`, so one failure (e.g. news scraping timing out) just leaves that field empty instead of failing the ask. News → insights is sequenced, mirroring the lazy-load order the views use.

### What `ensureQueryData` does

Roughly `getQueryData(key) ?? fetchQuery(options)`:

- **Cache hit → instant.** If a widget already fetched that key, the data is returned with no network call.
- **Miss → normal fetch.** The `queryFn` runs and the result is written into the QueryCache exactly as if a component fetched it — which fires the success event that `querySync` mirrors into Redux. In-flight requests for the same key are awaited, not duplicated.
- **Stale data counts.** By default it does not refetch data older than `staleTime`; existing data is "ensured".

Note that `ensureCompleteSnapshot` never writes to Redux itself — completeness arrives through the same `querySync` pipeline as every other fetch.

## Sending — `ChatbotView.tsx` → `POST /api/analysis/stream`

When a suggested question is clicked:

1. The current `selectedSec` is captured (the chatbot always tracks the currently selected card; changing selection resets the chat).
2. `ensureCompleteSnapshot(...)` runs (the "gathering" shimmer state — mean reversion is the slow path since the server fetches several peer symbols).
3. The snapshot is read imperatively: `store.getState().analysis.snapshots[symbol]`.
4. It's POSTed as `{ symbol, question, timeframe, interval, snapshot }` to `/api/analysis/stream`, which streams back plain-text markdown (rendered live with `react-markdown`; the panel auto-scrolls to follow the tail unless the user scrolls up).

On the server, `server/src/analysis/analysis.prompt.ts` distills the snapshot into a token-sane prompt (summary stats + a 30-point price tail + latest indicator signals), skipping any missing sections, and `analysis.service.ts` streams the Claude response. Because the snapshot carries full price series, `server/src/app.ts` raises the JSON body limit to 5 MB.

## Gotchas

- **Query-key convention is load-bearing.** New per-symbol queries must keep the symbol at `queryKey[1]` and register their prefix in `KEY_TO_FIELD` if they should be mirrored.
- **Non-default widget windows overwrite the field.** If a user flips RSI to window 7, that result syncs into the snapshot (last write wins); the chatbot's next `ensureQueryData` with the default 14 fetches and overwrites it, so the payload sent to the server is always the default-window view.
- **`suggestions` queries are intentionally unmirrored** — the search box's `["suggestions", term]` keys pass the shape guards but aren't in `KEY_TO_FIELD`.
