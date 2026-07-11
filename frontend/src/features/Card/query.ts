import { queryOptions, useQuery } from "@tanstack/react-query"
import { apiGet } from "../../lib/api"
import { useAppSelector } from "../../app/hooks"
import type { TInterval } from "../Form/formSlice"

// raw quote as returned by /api/security (dates are ISO strings over the wire)
export interface IChartQuote {
    date: string
    open: number | null
    high: number | null
    low: number | null
    close: number | null
    volume: number | null
    adjclose?: number | null
}

// the client-side shape kept in the query cache: close mapped to price
export interface IPricePoint {
    date: string
    price: number
}

export function chartQueryOptions(symbol: string, start: string, end: string, interval: TInterval) {
    return queryOptions({
        queryKey: ["chart", symbol, start, end, interval],
        queryFn: async (): Promise<IPricePoint[]> => {
            const arr = await apiGet<IChartQuote[]>("/api/security", {
                symbol,
                start: new Date(start).getTime(),
                end: new Date(end).getTime(),
                interval,
            })
            return arr
                .filter((d): d is IChartQuote & { close: number } => d.close !== null)
                .map(d => ({ date: d.date, price: d.close }))
        },
        enabled: !!symbol,
    })
}

export function useGetChart(symbol: string) {
    const { start, end, interval } = useAppSelector((state) => state.form)
    return useQuery(chartQueryOptions(symbol, start, end, interval))
}
