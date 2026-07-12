import { standardDeviation } from "simple-statistics"
import type { IDataPoint, IRatePoint } from "../analytics.helper.js"

export interface IRollingStatsResult {
    rollingReturn: IRatePoint[]
    rollingVolatility: IRatePoint[]
    momentumScore: number
    riskScore: number
}

export function calcRollingStats(dataPoints: IDataPoint[], window: number): IRollingStatsResult {

    const prices = dataPoints.map(data => data.price)
    const dates = dataPoints.map(data => data.date)

    // Calculate daily % changes
    const percentChange: number[] = []
    for (let i = 1; i < prices.length; i++) {
        percentChange.push(prices[i] / prices[i - 1] - 1)
    }

    const rollingReturn: IRatePoint[] = dates.map(date => ({ date, rate: NaN }))
    const rollingVolatility: IRatePoint[] = dates.map(date => ({ date, rate: NaN }))

    // Moving the window
    for (let i = window; i < prices.length; i++) {
        const startIndex = i - window
        const endIndex = i

        // Extracting the window
        const thisWindow = percentChange.slice(startIndex, endIndex)

        // METRIC 1: Rolling Return
        rollingReturn[i] = {
            date: dates[i],
            rate: prices[endIndex] / prices[startIndex] - 1
        }

        // METRIC 2: Rolling Volatility
        rollingVolatility[i] = {
            date: dates[i],
            rate: standardDeviation(thisWindow)
        }
    }

    // METRIC 3: Momentum Score
    const sortedReturn = rollingReturn.map(r => r.rate).filter(r => !Number.isNaN(r)).sort((a, b) => a - b)
    const latestReturn = rollingReturn.map(r => r.rate)[rollingReturn.length - 1]
    const momentumScore = parseFloat((sortedReturn.findIndex(r => r === latestReturn) / (sortedReturn.length - 1) * 100).toFixed(1))

    // METRIC 4: Risk Score
    const sortedVolatility = rollingVolatility.map(r => r.rate).filter(r => !Number.isNaN(r)).sort((a, b) => a - b)
    const latestVolatility = rollingVolatility.map(r => r.rate)[rollingVolatility.length - 1]
    const riskScore = parseFloat((100 - sortedVolatility.findIndex(r => r === latestVolatility) / (sortedVolatility.length - 1) * 100).toFixed(1))

    return { rollingReturn, rollingVolatility, momentumScore, riskScore }
}
