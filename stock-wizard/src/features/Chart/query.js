import { useQuery } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { apiGet, apiPost } from "../../lib/api"
import { useGetChart } from "../Card/query"

export function useGetRollingStats(symbol, window) {
    const chart = useGetChart(symbol)
    const { start, end, interval } = useSelector((state) => state.form)

    return useQuery({
        queryKey: ["rolling-stats", symbol, start, end, interval, window],
        queryFn: () => apiPost("/api/analytics/rolling-stats", { dataPoints: chart.data, window }),
        enabled: !!chart.data && !!window,
    })
}

export function useGetMovingAverage(symbol, window) {
    const chart = useGetChart(symbol)
    const { start, end, interval } = useSelector((state) => state.form)

    return useQuery({
        queryKey: ["moving-average", symbol, start, end, interval, window],
        queryFn: () => apiPost("/api/analytics/moving-average", { dataPoints: chart.data, window }),
        enabled: !!chart.data && !!window,
    })
}

export function useGetProfile(symbol) {
    return useQuery({
        queryKey: ["profile", symbol],
        queryFn: () => apiGet("/api/security/profile", { symbol }),
        enabled: !!symbol,
        staleTime: 60 * 60 * 1000,
    })
}

export function useGetFinancials(symbol) {
    return useQuery({
        queryKey: ["financials", symbol],
        queryFn: () => apiGet("/api/security/financials", { symbol }),
        enabled: !!symbol,
        staleTime: 60 * 60 * 1000,
    })
}

export function useGetNews(symbol) {
    return useQuery({
        queryKey: ["news", symbol],
        queryFn: () => apiGet("/api/security/news", { symbol }),
        enabled: !!symbol,
        staleTime: 15 * 60 * 1000,
    })
}

export function useGetNewsInsights(symbol, { enabled = true } = {}) {
    return useQuery({
        queryKey: ["news-insights", symbol],
        queryFn: () => apiGet("/api/security/news/insights", { symbol }),
        enabled: !!symbol && enabled,
        staleTime: 15 * 60 * 1000,
    })
}

export function useGetMeanReversion(symbol) {
    const { start, end, interval } = useSelector((state) => state.form)

    return useQuery({
        queryKey: ["mean-reversion", symbol, start, end, interval],
        queryFn: () => apiPost("/api/analytics/mean-reversion", {
            symbol,
            start: new Date(start).getTime(),
            end: new Date(end).getTime(),
            interval,
        }),
        enabled: !!symbol,
    })
}
