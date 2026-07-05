import { fetchChart, searchSuggestions, getRecommendations, fetchNews, fetchInsights, fetchProfile, fetchFinancials } from "../services/yahooService.js"

// fetch datapoints for a given security
export async function getChart(req, res) {
    try {
        const { symbol, start, end, interval } = req.query

        if (!symbol || !start || !end || !interval) {
            return res.status(400).send("Bad request")
        }

        const quotes = await fetchChart(symbol, start, end, interval)
        res.json(quotes)
    } catch (err) {
        res.status(500).send("Symbol does not exist!")
    }
}

// auto suggest securities when user types in search bar
export async function getSuggestions(req, res) {
    try {
        const { search } = req.query
        const suggestions = await searchSuggestions(search)
        res.json(suggestions)
    } catch (err) {
        res.status(500).send("Failed to fetch suggestions")
    }
}

// related symbols
export async function getRecommendationsCtrl(req, res) {
    try {
        const { symbol } = req.query
        const recommendations = await getRecommendations(symbol)
        res.json(recommendations)
    } catch (err) {
        res.status(500).send("Failed to fetch recommendations")
    }
}

// top news headlines for a security
export async function getNews(req, res) {
    try {
        const { symbol } = req.query
        if (!symbol) return res.status(400).send("Bad request")
        const news = await fetchNews(symbol, 3)
        res.json(news)
    } catch (err) {
        res.status(500).send("Failed to fetch news")
    }
}

// AI insights per article for a security
export async function getNewsInsights(req, res) {
    try {
        const { symbol } = req.query
        if (!symbol) return res.status(400).send("Bad request")
        const insights = await fetchInsights(symbol, 3)
        res.json(insights)
    } catch (err) {
        res.status(500).send("Failed to fetch insights")
    }
}

// company profile (sector, industry, country, business summary)
export async function getProfile(req, res) {
    try {
        const { symbol } = req.query
        if (!symbol) return res.status(400).send("Bad request")
        const profile = await fetchProfile(symbol)
        res.json(profile)
    } catch (err) {
        res.status(500).send("Failed to fetch profile")
    }
}

// financial metrics + upcoming calendar events
export async function getFinancials(req, res) {
    try {
        const { symbol } = req.query
        if (!symbol) return res.status(400).send("Bad request")
        const financials = await fetchFinancials(symbol)
        res.json(financials)
    } catch (err) {
        res.status(500).send("Failed to fetch financials")
    }
}
