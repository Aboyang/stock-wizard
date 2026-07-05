import { fetchChart, getRecommendations } from "./yahooService.js"

// orchestrate the data fetches needed by the mean-reversion helper
export async function gatherMeanReversionInputs(symbol, start, end, interval) {

    const targetQuotes = await fetchChart(symbol, start, end, interval)
    const targetDataPoints = targetQuotes.map(d => ({ date: d.date, price: d.close }))

    const recommendedSymbols = await getRecommendations(symbol)

    const recommendedSecs = []
    for (let rec of recommendedSymbols) {
        const quotes = await fetchChart(rec, start, end, interval)
        const dataPoints = quotes.map(d => ({ date: d.date, price: d.close }))
        recommendedSecs.push({ symbol: rec, dataPoints })
    }

    return { targetDataPoints, recommendedSecs }
}
