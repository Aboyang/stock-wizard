import { mean, sampleCorrelation, standardDeviation } from "simple-statistics"

export function calcMeanReversion(targetDataPoints, recommendedSecs) {

    // find best correlated security
    let bestCorrelated = { symbol: "", dataPoints: [], correlation: -1 }
    const targetPrices = targetDataPoints.map(d => d.price)

    for (let rec of recommendedSecs) {
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
    const signals = []
    for (let i = 0; i < priceSpread.length; i++) {
        const zScore = (priceSpread[i] - meanPriceSpread) / sdPriceSpread

        let action = "E"
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

    const normal = { meanPriceSpread, sdPriceSpread, priceSpread }

    return { bestCorrelated, normal, signals }
}
