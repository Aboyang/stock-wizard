import type { Request, Response } from "express"
import type { IDataPoint } from "./analytics.helper.js"
import { calcRollingStats } from "./rolling-stats/rolling-stats.helper.js"
import { calcMovingAvg } from "./moving-average/moving-average.helper.js"
import { calcRSI } from "./rsi/rsi.helper.js"
import { calcKDJ } from "./kdj/kdj.helper.js"
import { calcMeanReversion } from "./mean-reversion/mean-reversion.helper.js"
import { gatherMeanReversionInputs } from "./mean-reversion/mean-reversion.service.js"
import type { TChartInterval } from "../security/chart/chart.service.js"

interface IWindowedStatsBody {
    dataPoints?: IDataPoint[]
    window?: number
}

interface IMeanReversionBody {
    symbol?: string
    start?: string
    end?: string
    interval?: TChartInterval
}

// rolling return + volatility + scores
export function postRollingStats(req: Request<unknown, unknown, IWindowedStatsBody>, res: Response): void {
    const { dataPoints, window } = req.body

    if (!dataPoints || !window) {
        res.status(400).send("Invalid input")
        return
    }

    const result = calcRollingStats(dataPoints, window)
    res.json(result)
}

// moving average + crossover signals
export function postMovingAverage(req: Request<unknown, unknown, IWindowedStatsBody>, res: Response): void {
    const { dataPoints, window } = req.body

    if (!dataPoints) {
        res.status(400).send("Invalid input")
        return
    }

    const result = calcMovingAvg(dataPoints, window)
    res.json(result)
}

// relative strength index
export function postRSI(req: Request<unknown, unknown, IWindowedStatsBody>, res: Response): void {
    const { dataPoints, window } = req.body

    if (!dataPoints || !window) {
        res.status(400).send("Invalid input")
        return
    }

    const result = calcRSI(dataPoints, window)
    res.json(result)
}

// KDJ stochastic oscillator
export function postKDJ(req: Request<unknown, unknown, IWindowedStatsBody>, res: Response): void {
    const { dataPoints, window } = req.body

    if (!dataPoints || !window) {
        res.status(400).send("Invalid input")
        return
    }

    const result = calcKDJ(dataPoints, window)
    res.json(result)
}

// mean reversion (pairs trading)
export async function postMeanReversion(req: Request<unknown, unknown, IMeanReversionBody>, res: Response): Promise<void> {
    console.log("Received request for mean reversion")
    const { symbol, start, end, interval } = req.body

    if (!symbol || !start || !end || !interval) {
        res.status(400).send("Invalid input: symbol must be a string")
        return
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
