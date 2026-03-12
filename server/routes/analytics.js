import { Router } from "express"
import { calcRollingStats, calcMovingAvg, calcMeanReversion } from "../services/analyticsService.js"

const router = Router()

// Rolling return + volatility + scores
router.post("/rolling-stats", (req, res) => {
    const { dataPoints, window } = req.body

    if (!dataPoints || !window) {
        return res.status(400).send("Invalid input")
    }

    const result = calcRollingStats(dataPoints, window)
    res.json(result)
})

// Moving average + crossover signals
router.post("/moving-average", (req, res) => {
    const { dataPoints } = req.body

    if (!dataPoints) {
        return res.status(400).send("Invalid input")
    }

    const result = calcMovingAvg(dataPoints)
    res.json(result)
})

// Mean reversion (pairs trading)
router.post("/mean-reversion", async (req, res) => {
    console.log("Received request for mean reversion")
    const { symbol, start, end, interval } = req.body
    console.log(req.body)

    if (!symbol) {
        return res.status(400).send("Invalid input: symbol must be a string")
    }

    try {
        const result = await calcMeanReversion(symbol, start, end, interval)
        console.log("Result:", result)
        res.json(result)
    } catch (err) {
        console.error(err)
        res.status(500).send("Error computing mean reversion")
    }
})

export default router

