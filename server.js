import YahooFinance from "yahoo-finance2"
import cors from "cors"
import express from "express"
const app = express()
const yf = new YahooFinance()

// app.use to apply cors middleware; cors middleware to allow specific client
app.use(cors())

// fetch datapoints for a given security
app.get('/api/sec', (req, res) => {
    
    console.log(req.query)

    const { symbol, start, end, interval } = req.query

    if (symbol == "" || start == "" || end == "" || interval == "") {
        return res.status(400).send("Bad request")
    }

    const period1 = new Date(parseInt(start))
    const period2 = new Date(parseInt(end))


    yf.chart(symbol, {period1, period2, interval})
    .then(response => res.json(response.quotes))
    .catch(error => res.status(500).send("Symbol does not exist!"))
    
})

// auto suggest securities in when user interacts with search bar
app.get('/api/suggestion', (req, res) => {
    
    const search = req.query.search

    yf.search(search).then(response => {
        const suggestions = response.quotes.filter(suggestion => ['EQUITY', 'ETF'].includes(suggestion.quoteType)).map(suggestion => suggestion.symbol)
        res.json(suggestions)
    })
    
})

// related symbols
app.get('/api/recommendation', (req, res) => {

    const { symbol } = req.query

    yf.recommendationsBySymbol(symbol).then(response => {
        const recommendations = response.recommendedSymbols.map((symb) => symb.symbol)
        res.send(recommendations)
    })
    
})

app.listen(5001, () => console.log("Server listening on port 5001")) 
