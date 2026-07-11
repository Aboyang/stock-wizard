import type { Request, Response } from "express"
import { fetchChart } from "./chart/chart.service.js"
import type { TChartInterval } from "./chart/chart.service.js"
import { searchSuggestions, getRecommendations } from "./suggestion/suggestion.service.js"
import { fetchNews, fetchInsights } from "./news/news.service.js"
import { fetchProfile } from "./profile/profile.service.js"
import { fetchFinancials } from "./financial/financial.service.js"

interface IChartQuery {
    symbol?: string
    start?: string
    end?: string
    interval?: TChartInterval
}

interface ISuggestionQuery {
    search?: string
}

interface ISymbolQuery {
    symbol?: string
}

// fetch datapoints for a given security
export async function getChart(req: Request<unknown, unknown, unknown, IChartQuery>, res: Response): Promise<void> {
    try {
        const { symbol, start, end, interval } = req.query

        if (!symbol || !start || !end || !interval) {
            res.status(400).send("Bad request")
            return
        }

        const quotes = await fetchChart(symbol, start, end, interval)
        res.json(quotes)
    } catch (err) {
        res.status(500).send("Symbol does not exist!")
    }
}

// auto suggest securities when user types in search bar
export async function getSuggestions(req: Request<unknown, unknown, unknown, ISuggestionQuery>, res: Response): Promise<void> {
    try {
        const { search } = req.query
        const suggestions = await searchSuggestions(search ?? "")
        res.json(suggestions)
    } catch (err) {
        res.status(500).send("Failed to fetch suggestions")
    }
}

// related symbols
export async function getRecommendationsCtrl(req: Request<unknown, unknown, unknown, ISymbolQuery>, res: Response): Promise<void> {
    try {
        const { symbol } = req.query
        const recommendations = await getRecommendations(symbol ?? "")
        res.json(recommendations)
    } catch (err) {
        res.status(500).send("Failed to fetch recommendations")
    }
}

// top news headlines for a security
export async function getNews(req: Request<unknown, unknown, unknown, ISymbolQuery>, res: Response): Promise<void> {
    try {
        const { symbol } = req.query
        if (!symbol) {
            res.status(400).send("Bad request")
            return
        }
        const news = await fetchNews(symbol, 3)
        res.json(news)
    } catch (err) {
        res.status(500).send("Failed to fetch news")
    }
}

// AI insights per article for a security
export async function getNewsInsights(req: Request<unknown, unknown, unknown, ISymbolQuery>, res: Response): Promise<void> {
    try {
        const { symbol } = req.query
        if (!symbol) {
            res.status(400).send("Bad request")
            return
        }
        const insights = await fetchInsights(symbol, 3)
        res.json(insights)
    } catch (err) {
        res.status(500).send("Failed to fetch insights")
    }
}

// company profile (sector, industry, country, business summary)
export async function getProfile(req: Request<unknown, unknown, unknown, ISymbolQuery>, res: Response): Promise<void> {
    try {
        const { symbol } = req.query
        if (!symbol) {
            res.status(400).send("Bad request")
            return
        }
        const profile = await fetchProfile(symbol)
        res.json(profile)
    } catch (err) {
        res.status(500).send("Failed to fetch profile")
    }
}

// financial metrics + upcoming calendar events
export async function getFinancials(req: Request<unknown, unknown, unknown, ISymbolQuery>, res: Response): Promise<void> {
    try {
        const { symbol } = req.query
        if (!symbol) {
            res.status(400).send("Bad request")
            return
        }
        const financials = await fetchFinancials(symbol)
        res.json(financials)
    } catch (err) {
        res.status(500).send("Failed to fetch financials")
    }
}
