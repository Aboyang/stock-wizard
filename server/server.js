const yahoofinance = require('yahoo-finance2').default
const cors = require('cors')
const express = require('express')
const app = express()

// app.use to apply cors middleware; cors middleware to allow specific client
app.use(cors())

app.get('/api/sec', (req, res) => {
    
    console.log(req.query)

    const { symbol, start, end, interval } = req.query

    if (symbol == "" || start == "" || end == "" || interval == "") {
        res.sendStatus(400).send("Bad request")
    }

    const period1 = new Date(parseInt(start))
    const period2 = new Date(parseInt(end))

    yahoofinance.chart(symbol, {period1, period2, interval})
    .then(response => res.json(response.quotes))
    .catch(error => res.sendStatus(500).send("Symbol does not exist!"))
    
})

app.get('/api/suggestion', (req, res) => {
    
    const search = req.query.search

    yahoofinance.search(search).then(response => {
        const suggestions = response.quotes.filter(suggestion => ['EQUITY', 'ETF'].includes(suggestion.quoteType)).map(suggestion => suggestion.symbol)
        res.json(suggestions)
    })
    
})

app.listen(5001, () => console.log("Server listening on port 5001")) 
