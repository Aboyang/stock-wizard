import { mean, sampleCorrelation, standardDeviation } from "simple-statistics"
import type { IDataPoint } from "../analytics.helper.js"

export interface IRecommendedSecurity {
    symbol: string
    dataPoints: IDataPoint[]
}

export interface IBestCorrelated extends IRecommendedSecurity {
    correlation: number
}

// E = exit, S-L = short target / long pair, L-S = long target / short pair
export type TSignalAction = "E" | "S-L" | "L-S"

export interface ISignal {
    date: Date | string
    priceTarget: number
    pricePair: number
    priceSpread: number
    action: TSignalAction
}

export interface ISpreadDistribution {
    meanPriceSpread: number
    sdPriceSpread: number
    priceSpread: number[]
}

export interface IMeanReversionResult {
    bestCorrelated: IBestCorrelated
    normal: ISpreadDistribution
    signals: ISignal[]
}

export function calcMeanReversion(targetDataPoints: IDataPoint[], recommendedSecs: IRecommendedSecurity[]): IMeanReversionResult {

    // find best correlated security
    let bestCorrelated: IBestCorrelated = { symbol: "", dataPoints: [], correlation: -1 }
    const targetPrices = targetDataPoints.map(d => d.price)

    for (const rec of recommendedSecs) {
        const recPrices = rec.dataPoints.map(d => d.price)
        const corr = sampleCorrelation(targetPrices, recPrices)

        if (corr > bestCorrelated.correlation) {
            bestCorrelated = { symbol: rec.symbol, dataPoints: rec.dataPoints, correlation: corr }
        }
    }

    const pairPrices = bestCorrelated.dataPoints.map(d => d.price)
    const priceSpread = targetPrices.map((p, i) => p - pairPrices[i])

    const meanPriceSpread = mean(priceSpread)
    const sdPriceSpread = standardDeviation(priceSpread)

    // generate trading signals
    const signals: ISignal[] = []
    for (let i = 0; i < priceSpread.length; i++) {
        const zScore = (priceSpread[i] - meanPriceSpread) / sdPriceSpread

        let action: TSignalAction = "E"
        if (zScore > 1.5) action = "S-L"
        else if (zScore < -1.5) action = "L-S"

        // only append if action changes
        if (signals.length === 0 || action !== signals[signals.length - 1].action) {
            signals.push({
                date: targetDataPoints[i].date,
                priceTarget: targetDataPoints[i].price,
                pricePair: pairPrices[i],
                priceSpread: priceSpread[i],
                action
            })
        }
    }

    const normal: ISpreadDistribution = { meanPriceSpread, sdPriceSpread, priceSpread }

    return { bestCorrelated, normal, signals }
}
