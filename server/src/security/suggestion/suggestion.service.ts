import YahooFinance from "yahoo-finance2"

const yf = new YahooFinance()

export async function searchSuggestions(search: string): Promise<string[]> {
    const response = await yf.search(search)
    return response.quotes
        .filter(q => "quoteType" in q && typeof q.quoteType === "string" && ["EQUITY", "ETF"].includes(q.quoteType))
        .map(q => (q as { symbol: string }).symbol)
}

export async function getRecommendations(symbol: string): Promise<string[]> {
    const response = await yf.recommendationsBySymbol(symbol)
    return response.recommendedSymbols.map(s => s.symbol)
}
