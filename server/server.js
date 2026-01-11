const yahoofinance = require('yahoo-finance2').default
const cors = require('cors')
const express = require('express')
const app = express()

// Global crash handlers
process.on("uncaughtException", err => {
    console.error("UNCAUGHT EXCEPTION:", err)
})

process.on("unhandledRejection", err => {
    console.error("UNHANDLED PROMISE:", err)
})

// Apply CORS middleware
app.use(cors())

app.get('/api/sec', (req, res) => {
    
    console.log(req.query)

    const { symbol, start, end, interval } = req.query

    if (!symbol || !start || !end || !interval) {
        return res.status(400).send("Bad request")
    }

    const now = Date.now()
    const period1 = new Date(Math.min(parseInt(start), now))
    const period2 = new Date(Math.min(parseInt(end), now))

    yahoofinance.chart(symbol, { period1, period2, interval })
        .then(response => {
            if (!response || !response.quotes) {
                return res.status(404).send("Symbol data not found")
            }
            res.json(response.quotes)
        })
        .catch(error => {
            console.error("Yahoo Finance chart error:", error)
            res.status(500).send("Symbol does not exist!")
        })
    
})

app.get('/api/suggestion', (req, res) => {
    
    const search = req.query.search

    yahoofinance.search(search)
        .then(response => {
            if (!response || !response.quotes) return res.json([])
            const suggestions = response.quotes
                .filter(suggestion => ['EQUITY', 'ETF'].includes(suggestion.quoteType))
                .map(suggestion => suggestion.symbol)
            res.json(suggestions)
        })
        .catch(err => {
            console.error("Yahoo Finance search error:", err)
            res.status(500).json([])
        })
    
})

app.listen(5001, () => console.log("Server listening on port 5001"))
