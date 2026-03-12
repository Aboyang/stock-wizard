const yahoofinance = require('yahoo-finance2').default

async function test() {
    try {
        const res = await yahoofinance.chart("AAPL", {
            period1: new Date("2024-01-01"),
            period2: new Date("2024-07-01"),
            interval: "1d"
        })
        console.log(res.quotes)
    } catch (err) {
        console.error("YF Error:", err.message)
    }
}

test()
