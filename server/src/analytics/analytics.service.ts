import { fetchChart } from "../security/chart/chart.service.js"
import type { TChartInterval } from "../security/chart/chart.service.js"
import { getRecommendations } from "../security/suggestion/suggestion.service.js"
import type { IDataPoint, IRecommendedSecurity } from "./analytics.helper.js"

export interface IMeanReversionInputs {
    targetDataPoints: IDataPoint[]
    recommendedSecs: IRecommendedSecurity[]
}

// orchestrate the data fetches needed by the mean-reversion helper
export async function gatherMeanReversionInputs(symbol: string, start: string, end: string, interval: TChartInterval): Promise<IMeanReversionInputs> {

    const targetQuotes = await fetchChart(symbol, start, end, interval)
    const targetDataPoints: IDataPoint[] = targetQuotes.map(d => ({ date: d.date, price: d.close as number }))

    const recommendedSymbols = await getRecommendations(symbol)

    const recommendedSecs: IRecommendedSecurity[] = []
    for (const rec of recommendedSymbols) {
        const quotes = await fetchChart(rec, start, end, interval)
        const dataPoints: IDataPoint[] = quotes.map(d => ({ date: d.date, price: d.close as number }))
        recommendedSecs.push({ symbol: rec, dataPoints })
    }

    return { targetDataPoints, recommendedSecs }
}
