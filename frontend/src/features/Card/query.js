import { useQuery } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { apiGet } from "../../lib/api"

export function chartQueryOptions(symbol, start, end, interval) {
    return {
        queryKey: ["chart", symbol, start, end, interval],
        queryFn: async () => {
            const arr = await apiGet("/api/security", {
                symbol,
                start: new Date(start).getTime(),
                end: new Date(end).getTime(),
                interval,
            })
            return arr.map(d => ({ date: d.date, price: d.close }))
        },
        enabled: !!symbol,
    }
}

export function useGetChart(symbol) {
    const { start, end, interval } = useSelector((state) => state.form)
    return useQuery(chartQueryOptions(symbol, start, end, interval))
}
