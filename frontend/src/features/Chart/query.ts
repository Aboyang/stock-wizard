import { queryOptions, useQuery } from "@tanstack/react-query"
import { apiGet, apiPost } from "../../lib/api"
import { useAppSelector } from "../../app/hooks"
import { useGetChart } from "../Card/query"
import type { IPricePoint } from "../Card/query"
import type { TInterval } from "../Form/formSlice"

// --- response shapes (mirror the server's analytics/security types; dates are ISO strings over the wire) ---

export interface IRatePoint {
    date: string
    rate: number
}

export interface IRollingStatsResult {
    rollingReturn: IRatePoint[]
    rollingVolatility: IRatePoint[]
    momentumScore: number
    riskScore: number
}

export type TCrossoverSignal = "buy" | "sell"

export interface ICrossoverPoint {
    date: string
    price: number
    signal: TCrossoverSignal
}

export interface IMovingAverageResult {
    fastMA: IPricePoint[]
    slowMA: IPricePoint[]
    crossover: ICrossoverPoint[]
}

export type TRSISignal = "overbought" | "oversold" | "neutral"

export interface IRSIResult {
    rsi: IRatePoint[]
    latestRSI: number
    signal: TRSISignal
}

export type TKDJSignal = "overbought" | "oversold" | "neutral"

export interface IKDJResult {
    k: IRatePoint[]
    d: IRatePoint[]
    j: IRatePoint[]
    latestK: number
    latestD: number
    latestJ: number
    signal: TKDJSignal
}

export interface IBestCorrelated {
    symbol: string
    dataPoints: IPricePoint[]
    correlation: number
}

// E = exit, S-L = short target / long pair, L-S = long target / short pair
export type TSignalAction = "E" | "S-L" | "L-S"

export interface ISignal {
    date: string
    priceTarget: number
    pricePair: number
    priceSpread: number
    action: TSignalAction
}

export interface ISpreadDistribution {
    meanPriceSpread: number
    sdPriceSpread: number
    priceSpread: number[]
}

export interface IMeanReversionResult {
    bestCorrelated: IBestCorrelated
    normal: ISpreadDistribution
    signals: ISignal[]
}

export interface ISecurityProfile {
    sector: string | null
    industry: string | null
    country: string | null
    summary: string | null
    website: string | null
    employees: number | null
}

export interface IFinancialEvents {
    earningsDate: string | null
    exDividendDate: string | null
    dividendDate: string | null
}

export interface IFinancials {
    revenue: number | null
    grossProfit: number | null
    freeCashFlow: number | null
    revenueYoY: number | null
    grossProfitYoY: number | null
    freeCashFlowYoY: number | null
    targetPrice: number | null
    eps: number | null
    peRatio: number | null
    sectorPE: number | null
    events: IFinancialEvents
}

export interface INewsArticle {
    uuid: string
    title: string
    publisher: string
    link: string
    providerPublishTime: string
    thumbnail: string | null
}

export interface INewsInsight {
    uuid: string
    summary?: string
    insight?: string
    recommendation?: string
}

// --- query options (shared between hooks and imperative ensureQueryData calls) ---

export function rollingStatsQueryOptions(symbol: string, start: string, end: string, interval: TInterval, window: number, dataPoints: IPricePoint[] | undefined) {
    return queryOptions({
        queryKey: ["rolling-stats", symbol, start, end, interval, window],
        queryFn: () => apiPost<IRollingStatsResult>("/api/analytics/rolling-stats", { dataPoints, window }),
        enabled: !!dataPoints && !!window,
    })
}

export function movingAverageQueryOptions(symbol: string, start: string, end: string, interval: TInterval, window: number, dataPoints: IPricePoint[] | undefined) {
    return queryOptions({
        queryKey: ["moving-average", symbol, start, end, interval, window],
        queryFn: () => apiPost<IMovingAverageResult>("/api/analytics/moving-average", { dataPoints, window }),
        enabled: !!dataPoints && !!window,
    })
}

export function rsiQueryOptions(symbol: string, start: string, end: string, interval: TInterval, window: number, dataPoints: IPricePoint[] | undefined) {
    return queryOptions({
        queryKey: ["rsi", symbol, start, end, interval, window],
        queryFn: () => apiPost<IRSIResult>("/api/analytics/rsi", { dataPoints, window }),
        enabled: !!dataPoints && !!window,
    })
}

export function kdjQueryOptions(symbol: string, start: string, end: string, interval: TInterval, window: number, dataPoints: IPricePoint[] | undefined) {
    return queryOptions({
        queryKey: ["kdj", symbol, start, end, interval, window],
        queryFn: () => apiPost<IKDJResult>("/api/analytics/kdj", { dataPoints, window }),
        enabled: !!dataPoints && !!window,
    })
}

export function profileQueryOptions(symbol: string) {
    return queryOptions({
        queryKey: ["profile", symbol],
        queryFn: () => apiGet<ISecurityProfile>("/api/security/profile", { symbol }),
        enabled: !!symbol,
        staleTime: 60 * 60 * 1000,
    })
}

export function financialsQueryOptions(symbol: string) {
    return queryOptions({
        queryKey: ["financials", symbol],
        queryFn: () => apiGet<IFinancials>("/api/security/financials", { symbol }),
        enabled: !!symbol,
        staleTime: 60 * 60 * 1000,
    })
}

export function newsQueryOptions(symbol: string) {
    return queryOptions({
        queryKey: ["news", symbol],
        queryFn: () => apiGet<INewsArticle[]>("/api/security/news", { symbol }),
        enabled: !!symbol,
        staleTime: 15 * 60 * 1000,
    })
}

export function newsInsightsQueryOptions(symbol: string) {
    return queryOptions({
        queryKey: ["news-insights", symbol],
        queryFn: () => apiGet<INewsInsight[]>("/api/security/news/insights", { symbol }),
        enabled: !!symbol,
        staleTime: 15 * 60 * 1000,
    })
}

export function meanReversionQueryOptions(symbol: string, start: string, end: string, interval: TInterval) {
    return queryOptions({
        queryKey: ["mean-reversion", symbol, start, end, interval],
        queryFn: () => apiPost<IMeanReversionResult>("/api/analytics/mean-reversion", {
            symbol,
            start: new Date(start).getTime(),
            end: new Date(end).getTime(),
            interval,
        }),
        enabled: !!symbol,
    })
}

// --- hooks ---

export function useGetRollingStats(symbol: string, window: number) {
    const chart = useGetChart(symbol)
    const { start, end, interval } = useAppSelector((state) => state.form)
    return useQuery(rollingStatsQueryOptions(symbol, start, end, interval, window, chart.data))
}

export function useGetMovingAverage(symbol: string, window: number) {
    const chart = useGetChart(symbol)
    const { start, end, interval } = useAppSelector((state) => state.form)
    return useQuery(movingAverageQueryOptions(symbol, start, end, interval, window, chart.data))
}

export function useGetRSI(symbol: string, window: number) {
    const chart = useGetChart(symbol)
    const { start, end, interval } = useAppSelector((state) => state.form)
    return useQuery(rsiQueryOptions(symbol, start, end, interval, window, chart.data))
}

export function useGetKDJ(symbol: string, window: number) {
    const chart = useGetChart(symbol)
    const { start, end, interval } = useAppSelector((state) => state.form)
    return useQuery(kdjQueryOptions(symbol, start, end, interval, window, chart.data))
}

export function useGetProfile(symbol: string) {
    return useQuery(profileQueryOptions(symbol))
}

export function useGetFinancials(symbol: string) {
    return useQuery(financialsQueryOptions(symbol))
}

export function useGetNews(symbol: string) {
    return useQuery(newsQueryOptions(symbol))
}

export function useGetNewsInsights(symbol: string, { enabled = true }: { enabled?: boolean } = {}) {
    return useQuery({
        ...newsInsightsQueryOptions(symbol),
        enabled: !!symbol && enabled,
    })
}

export function useGetMeanReversion(symbol: string) {
    const { start, end, interval } = useAppSelector((state) => state.form)
    return useQuery(meanReversionQueryOptions(symbol, start, end, interval))
}
