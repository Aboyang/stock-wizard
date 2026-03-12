import { Router } from "express"
import YahooFinance from "yahoo-finance2"
import { getCache, setCache } from "../services/redis.js"

const router = Router()
const yf = new YahooFinance()

// fetch datapoints for a given security
router.get("/", async (req, res) => {
    try {
        const { symbol, start, end, interval } = req.query

        if (!symbol || !start || !end || !interval) {
            return res.status(400).send("Bad request")
        }

        const startTime = Date.now()

        // check cache first
        const cacheKey = `chart:${symbol}:${Math.floor(new Date(parseInt(start)).getTime() / 86400000)}:${Math.floor(new Date(parseInt(end)).getTime() / 86400000)}:${interval}`

        console.log(`>>> Cache key: ${cacheKey}`)

        const cached = await getCache(cacheKey)
        console.log(">>> Checking cache...")
        if (cached) {
            console.log(">>> Cache hit!")
            const endTime = Date.now()
            console.log(`Latency: ${endTime - startTime}ms`)
            return res.json(cached)
        }

        console.log(">>> Cache miss!")
        
        // if not in cache, fetch from Yahoo Finance
        console.log(">>> Fetching from Yahoo Finance...")

        const period1 = new Date(parseInt(start))
        const period2 = new Date(parseInt(end))

        const response = await yf.chart(symbol, {
            period1,
            period2,
            interval
        })

        const endTime = Date.now()
        console.log(`Latency: ${endTime - startTime}ms`)

        const quotes = response.quotes
        
        // store in cache for 5 minutes
        await setCache(cacheKey, quotes, 300)

        res.json(quotes)
    } catch (err) {
        res.status(500).send("Symbol does not exist!")
    }
})

// auto suggest securities when user types in search bar
router.get("/suggestion", async (req, res) => {
    try {
        const { search } = req.query

        const response = await yf.search(search)

        const suggestions = response.quotes
            .filter(q => ["EQUITY", "ETF"].includes(q.quoteType))
            .map(q => q.symbol)

        res.json(suggestions)
    } catch (err) {
        res.status(500).send("Failed to fetch suggestions")
    }
})

// related symbols
router.get("/recommendation", async (req, res) => {
    try {
        const { symbol } = req.query

        const response = await yf.recommendationsBySymbol(symbol)

        const recommendations = response.recommendedSymbols.map(s => s.symbol)

        res.json(recommendations)
    } catch (err) {
        res.status(500).send("Failed to fetch recommendations")
    }
})

export default router
