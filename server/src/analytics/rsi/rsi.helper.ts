import { mean } from "simple-statistics"
import type { IDataPoint, IRatePoint } from "../analytics.helper.js"

export type TRSISignal = "overbought" | "oversold" | "neutral"

export interface IRSIResult {
    rsi: IRatePoint[]
    latestRSI: number
    signal: TRSISignal
}

export function calcRSI(dataPoints: IDataPoint[], window: number = 14): IRSIResult {

    const prices = dataPoints.map(data => data.price)
    const dates = dataPoints.map(data => data.date)

    if (prices.length <= window) {
        return { rsi: [], latestRSI: NaN, signal: "neutral" }
    }

    // Split daily changes into gains and losses
    const gains: number[] = []
    const losses: number[] = []
    for (let i = 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1]
        gains.push(Math.max(change, 0))
        losses.push(Math.max(-change, 0))
    }

    function rsiFrom(avgGain: number, avgLoss: number): number {
        if (avgLoss === 0) return 100
        return parseFloat((100 - 100 / (1 + avgGain / avgLoss)).toFixed(2))
    }

    // Seed with simple averages, then apply Wilder's smoothing
    let avgGain = mean(gains.slice(0, window))
    let avgLoss = mean(losses.slice(0, window))

    const rsi: IRatePoint[] = [{ date: dates[window], rate: rsiFrom(avgGain, avgLoss) }]

    for (let i = window; i < gains.length; i++) {
        avgGain = (avgGain * (window - 1) + gains[i]) / window
        avgLoss = (avgLoss * (window - 1) + losses[i]) / window
        rsi.push({ date: dates[i + 1], rate: rsiFrom(avgGain, avgLoss) })
    }

    const latestRSI = rsi[rsi.length - 1].rate
    const signal: TRSISignal = latestRSI > 70 ? "overbought" : latestRSI < 30 ? "oversold" : "neutral"

    return { rsi, latestRSI, signal }
}
