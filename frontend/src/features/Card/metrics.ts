import { mean, standardDeviation } from "simple-statistics"
import type { IPricePoint } from "./query"
import type { TInterval } from "../Form/formSlice"

export interface ICardMetrics {
    annualReturn: number
    annualVolatility: number
    sharpe: number
}

export function calcCardMetrics(priceData: IPricePoint[], interval: TInterval): ICardMetrics | null {
    if (priceData.length < 2) return null

    let scale = 0
    switch (interval) {
        case '1d':
            scale = 252
            break
        case '1wk':
            scale = 52
            break
        case '1mo':
            scale = 12
            break
    }

    const prices = priceData.map(data => data.price)

    const percentChange: number[] = []
    for (let i = 1; i < prices.length; i ++) {
        percentChange.push((prices[i] / prices[i - 1] - 1))
    }

    const annualReturn = mean(percentChange) * scale
    const annualVolatility = standardDeviation(percentChange) * Math.sqrt(scale)
    const sharpe = (annualReturn - 0.04) / annualVolatility
    return { annualReturn, annualVolatility, sharpe }
}
