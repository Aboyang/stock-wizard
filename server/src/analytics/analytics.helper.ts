import { mean, sampleCorrelation, standardDeviation } from "simple-statistics"

// dates are ISO strings when posted from the client, Date objects when built server-side
export interface IDataPoint {
    date: Date | string
    price: number
}

export interface IRatePoint {
    date: Date | string
    rate: number
}

export interface IRollingStatsResult {
    rollingReturn: IRatePoint[]
    rollingVolatility: IRatePoint[]
    momentumScore: number
    riskScore: number
}

export type TCrossoverSignal = "buy" | "sell"

export interface ICrossoverPoint {
    date: Date | string
    price: number
    signal: TCrossoverSignal
}

export interface IMovingAverageResult {
    fastMA: IDataPoint[]
    slowMA: IDataPoint[]
    crossover: ICrossoverPoint[]
}

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

export function calcMovingAvg(dataPoints: IDataPoint[], window: number = 5): IMovingAverageResult {

    const prices = dataPoints.map(data => data.price)
    const dates = dataPoints.map(data => data.date)

    function movingAvg(w: number): IDataPoint[] {

        const ma: IDataPoint[] = []
        for (let i = w; i < prices.length; i++) {
            const startIndex = i - w
            const endIndex = i

            // Extracting the window
            const thisWindow = prices.slice(startIndex, endIndex)

            // Calculation
            ma.push({
                date: dates[i],
                price: mean(thisWindow)
            })
        }

        return ma
    }

    let fastMA = movingAvg(window)
    const slowMA = movingAvg(window * 2)

    const offset = fastMA.length - slowMA.length
    fastMA = fastMA.slice(offset)


    // finding the crossover
    const crossover: ICrossoverPoint[] = []

    let prevDiff = fastMA[0].price - slowMA[0].price

    for (let i = 1; i < fastMA.length; i++) {

        const currentDiff = fastMA[i].price - slowMA[i].price
        if (currentDiff / prevDiff < 0) {

            const crossoverDate = fastMA[i].date
            const crossoverPrice = dataPoints.filter(data => data.date === crossoverDate)[0].price
            const signal: TCrossoverSignal = currentDiff > 0 ? "buy" : "sell"

            crossover.push({ date: crossoverDate, price: crossoverPrice, signal })
        }

        prevDiff = currentDiff
    }

    return { fastMA, slowMA, crossover }
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
