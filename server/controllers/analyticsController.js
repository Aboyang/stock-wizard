import { calcRollingStats } from "../helpers/rollingStats.js"
import { calcMovingAvg } from "../helpers/movingAverage.js"
import { calcMeanReversion } from "../helpers/meanReversion.js"
import { gatherMeanReversionInputs } from "../services/meanReversionService.js"

// rolling return + volatility + scores
export function postRollingStats(req, res) {
    const { dataPoints, window } = req.body

    if (!dataPoints || !window) {
        return res.status(400).send("Invalid input")
    }

    const result = calcRollingStats(dataPoints, window)
    res.json(result)
}

// moving average + crossover signals
export function postMovingAverage(req, res) {
    const { dataPoints, window } = req.body

    if (!dataPoints) {
        return res.status(400).send("Invalid input")
    }

    const result = calcMovingAvg(dataPoints, window)
    res.json(result)
}

// mean reversion (pairs trading)
export async function postMeanReversion(req, res) {
    console.log("Received request for mean reversion")
    const { symbol, start, end, interval } = req.body

    if (!symbol) {
        return res.status(400).send("Invalid input: symbol must be a string")
    }

    try {
        const { targetDataPoints, recommendedSecs } = await gatherMeanReversionInputs(symbol, start, end, interval)
        const result = calcMeanReversion(targetDataPoints, recommendedSecs)
        res.json(result)
    } catch (err) {
        console.error(err)
        res.status(500).send("Error computing mean reversion")
    }
}
