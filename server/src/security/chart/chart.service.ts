import YahooFinance from "yahoo-finance2"
import { getCache, setCache } from "../../shared/cache.service.js"

const yf = new YahooFinance()

export type TChartInterval =
    | "1m" | "2m" | "5m" | "15m" | "30m" | "60m" | "90m"
    | "1h" | "1d" | "5d" | "1wk" | "1mo" | "3mo"

// dates are Date objects fresh from Yahoo, ISO strings after a round-trip through the Redis cache
export interface IChartQuote {
    date: Date | string
    open: number | null
    high: number | null
    low: number | null
    close: number | null
    volume: number | null
    adjclose?: number | null
}

// fetch chart data for a security; cache-first (5min TTL, bucketed by day)
export async function fetchChart(symbol: string, start: string, end: string, interval: TChartInterval): Promise<IChartQuote[]> {
    const startTime = Date.now()

    const cacheKey = `chart:${symbol}:${Math.floor(new Date(parseInt(start)).getTime() / 86400000)}:${Math.floor(new Date(parseInt(end)).getTime() / 86400000)}:${interval}`

    console.log(`>>> Cache key: ${cacheKey}`)

    const cached = await getCache<IChartQuote[]>(cacheKey)
    console.log(">>> Checking cache...")
    if (cached) {
        console.log(">>> Cache hit!")
        console.log(`Latency: ${Date.now() - startTime}ms`)
        return cached
    }

    console.log(">>> Cache miss!")
    console.log(">>> Fetching from Yahoo Finance...")

    const period1 = new Date(parseInt(start))
    const period2 = new Date(parseInt(end))

    const response = await yf.chart(symbol, { period1, period2, interval })

    console.log(`Latency: ${Date.now() - startTime}ms`)

    const quotes: IChartQuote[] = response.quotes
    await setCache(cacheKey, quotes, 300)

    return quotes
}
