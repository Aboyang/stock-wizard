import type { QueryClient } from "@tanstack/react-query"
import { chartQueryOptions } from "../Card/query"
import {
    rollingStatsQueryOptions,
    movingAverageQueryOptions,
    rsiQueryOptions,
    kdjQueryOptions,
    profileQueryOptions,
    financialsQueryOptions,
    newsQueryOptions,
    newsInsightsQueryOptions,
    meanReversionQueryOptions,
} from "../Chart/query"
import type { IFormState } from "../Form/formSlice"

// the widget default windows — matches what the views fetch, so cache entries are shared
const WINDOWS = { rolling: 10, ma: 5, rsi: 14, kdj: 9 }

// fills every gap in the query cache for one symbol (widgets not mounted, lazy insights, ...);
// each successful fetch flows into state.analysis.snapshots[symbol] via startQuerySync
export async function ensureCompleteSnapshot(queryClient: QueryClient, symbol: string, form: IFormState): Promise<void> {
    const { start, end, interval } = form

    // prices first — the analytics endpoints need them, and no prices means nothing to analyse
    const prices = await queryClient.ensureQueryData(chartQueryOptions(symbol, start, end, interval))

    // the rest is best-effort: a failed piece just leaves its snapshot field empty
    await Promise.allSettled([
        queryClient.ensureQueryData(rollingStatsQueryOptions(symbol, start, end, interval, WINDOWS.rolling, prices)),
        queryClient.ensureQueryData(movingAverageQueryOptions(symbol, start, end, interval, WINDOWS.ma, prices)),
        queryClient.ensureQueryData(rsiQueryOptions(symbol, start, end, interval, WINDOWS.rsi, prices)),
        queryClient.ensureQueryData(kdjQueryOptions(symbol, start, end, interval, WINDOWS.kdj, prices)),
        queryClient.ensureQueryData(profileQueryOptions(symbol)),
        queryClient.ensureQueryData(financialsQueryOptions(symbol)),
        queryClient
            .ensureQueryData(newsQueryOptions(symbol))
            .then(() => queryClient.ensureQueryData(newsInsightsQueryOptions(symbol))),
        queryClient.ensureQueryData(meanReversionQueryOptions(symbol, start, end, interval)),
    ])
}
