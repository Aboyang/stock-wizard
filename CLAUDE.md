# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Stock Wizard is a two-tier app: a Vite/React frontend (`frontend/`) and an Express API (`server/`) that proxies Yahoo Finance and computes analytics. Both halves are independent npm projects with their own `package.json` and `node_modules` — there is no monorepo tooling.

There is **also** a legacy single-file server at the repo root (`server.js` + root `package.json`). It is superseded by `server/app.js` and lacks the Redis cache, route modularization, and analytics endpoints. Treat root `server.js` as dead code unless explicitly asked to touch it; all new server work goes in `server/`.

### Backend (`server/`)
- `app.js` boots Express on port **5001** and mounts two routers.
- `routes/security.js` → `/api/security` (chart data), `/api/security/suggestion`, `/api/security/recommendation`. Chart responses are cached in Redis under a key bucketed by `symbol:startDay:endDay:interval` with a 300s TTL. The cache layer (`services/redis.js`) calls `client.connect()` at import-time using default localhost settings — Redis must be running locally or the server will fail to start.
- `routes/analytics.js` → `/api/analytics/rolling-stats`, `/moving-average`, `/mean-reversion`. The first two are pure functions over `dataPoints` posted from the client. `/mean-reversion` is different: the handler calls `calcMeanReversion` in `services/analyticsService.js`, which **re-enters this same server via `axios` to `http://localhost:5001/api/security` and `/api/security/recommendation`** to pull the target and each recommended symbol's price history. It deliberately `sleep(2000)`s between recommended-symbol fetches to dodge Yahoo rate limits, so a mean-reversion call takes ~20s for ~10 recommendations on a cold cache. The Redis cache in `routes/security.js` is what makes the second and subsequent calls cheap.
- `nodemon.json` watches `app.js`, `routes/`, `services/` and ignores `client.js` (a manual Yahoo-Finance scratchpad — not part of the running server).

### Frontend (`frontend/`)
- Redux Toolkit store (`src/app/store.jsx`) with two slices: `securitySlice` (watchlist symbols, fetched price data keyed by symbol, currently selected symbol) and `formSlice` (start/end/timeframe/interval). `redux-logger` is wired into middleware.
- `securitySlice.fetchData` is an async thunk reading `form` state via `getState()` to build the query — the timeframe controls drive refetches indirectly through this coupling, not via thunk arguments.
- Feature folders under `src/features/`: `Form` (search + timeframe), `Carousel`/`Card` (watchlist with annualized return/vol/Sharpe computed client-side from prices), `Chart/ChartView` (multi-symbol overview), `Chart/RollingView` + `Chart/MAView` + `Chart/PairView` (per-symbol analytics shown when a card is selected; these POST the in-memory `secData[selectedSec]` back to the server's analytics endpoints rather than re-fetching).
- All charts use Chart.js via `react-chartjs-2` with the luxon time adapter and zoom + annotation plugins; each view re-runs `ChartJS.register(...)` on mount.

### Key data-flow quirks
- The API base URL is hard-coded to `http://localhost:5001` in every fetch call across the frontend — there is no env-var indirection. If the port changes, grep for it.
- `secData` in Redux is `{ [symbol]: [{ date, price }] }`. The backend returns `{ date, close, open, high, low, volume, adjclose }`; the mapping to `{ date, price: d.close }` happens in `securitySlice.fetchData` and again inside `calcMeanReversion` on the server.
- `formSlice.changeTimeframe` recomputes `start` from `Date.now()` using a hard-coded month-in-ms constant (`2592000000`). The same constant appears in chart `min` props.

## Common commands

From repo root:
```
npm install       # installs concurrently
npm run dev       # boots frontend + server together
npm run install:all  # installs deps in root, frontend, and server
```

Frontend (`cd frontend`):
```
npm install
npm run dev      # Vite dev server
npm run build    # production build to dist/
npm run lint     # ESLint over **/*.{js,jsx}
npm run preview  # serve the built dist/
```
Frontend reads `VITE_API_BASE_URL` (see `.env.example`); falls back to `http://localhost:5001` when unset.

Backend (`cd server`):
```
npm install
npm start        # node app.js
npm run dev      # node --watch app.js
```
Backend reads `PORT` (default `5001`) and `REDIS_URL` (default `redis://localhost:6380`). See `.env.example`. Redis must be reachable before `app.js` finishes booting — `services/cacheService.js` awaits `client.connect()` at module load.

There is no test suite.
