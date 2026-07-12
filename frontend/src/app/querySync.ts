import type { QueryClient } from "@tanstack/react-query"
import store from "./store"
import { mergeSnapshot } from "../features/analysisSlice"
import type { ISecuritySnapshot } from "../features/analysisSlice"

// query-key prefix → snapshot field; every per-symbol query keeps its symbol at queryKey[1]
const KEY_TO_FIELD: Record<string, keyof ISecuritySnapshot> = {
    "chart": "prices",
    "rolling-stats": "rollingStats",
    "moving-average": "movingAverage",
    "rsi": "rsi",
    "kdj": "kdj",
    "mean-reversion": "meanReversion",
    "profile": "profile",
    "financials": "financials",
    "news": "news",
    "news-insights": "newsInsights",
}

// mirrors every successful per-symbol query into the analysis slice,
// so state.analysis.snapshots[symbol] always holds the latest server data
export function startQuerySync(queryClient: QueryClient): void {
    queryClient.getQueryCache().subscribe((event) => {
        if (event.type !== "updated" || event.action.type !== "success") return

        const [kind, symbol] = event.query.queryKey
        if (typeof kind !== "string" || typeof symbol !== "string" || symbol === "") return

        const field = KEY_TO_FIELD[kind]
        if (!field) return

        store.dispatch(mergeSnapshot({
            symbol,
            data: { [field]: event.query.state.data } as Partial<ISecuritySnapshot>,
        }))
    })
}
