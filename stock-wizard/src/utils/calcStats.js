import { mean, sampleCorrelation, standardDeviation } from 'simple-statistics'
// import { subtract } from 'mathjs'

export function calcRollingStats(dataPoints, window) {

    const prices = dataPoints.map(data => data.price)
    const dates = dataPoints.map(data => data.date)

    // Calculate daily % changes
    const percentChange = []
    for (let i = 1; i < prices.length; i++) {
        percentChange.push(prices[i] / prices[i - 1] - 1)
    }

    const rollingReturn = dates.map(date => ({ date, rate: NaN }))
    const rollingVolatility = dates.map(date => ({ date, rate: NaN }))

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

export function calcMovingAvg(dataPoints, window) {

    const prices = dataPoints.map(data => data.price)
    const dates = dataPoints.map(data => data.date)

    function movingAvg(window) {

        let ma = []
        for (let i = window; i < prices.length; i++) {
            const startIndex = i - window
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
    let slowMA = movingAvg(window * 2)

    const offset = fastMA.length - slowMA.length
    fastMA = fastMA.slice(offset)


    // finding the crossover
    let crossover = []

    let prevDiff = fastMA[0].price - slowMA[0].price

    for (let i = 1; i < fastMA.length; i++) {
        
        const currentDiff = fastMA[i].price - slowMA[i].price
        if (currentDiff / prevDiff <= 0) {

            const crossoverDate = fastMA[i].date
            const crossoverPrice = dataPoints.filter(data => data.date === crossoverDate)[0].price
            const signal = currentDiff > 0 ? "buy" : "sell"

            crossover.push({ date: crossoverDate, price: crossoverPrice, signal })
        }

        prevDiff = currentDiff
    }

    return { fastMA, slowMA, crossover }
}


export function calcMeanReversion(dataPoints, recommendedSecs) {

    console.log(recommendedSecs)


    let bestCorrelated = { symbol: "", dataPoints: [], correlation: -1 }

    const targetPrices = dataPoints.map(data => data.price) // time-series prices of target

    for (let rec of recommendedSecs) {
        const { symbol, dataPoints } = rec
        const pairPrices = dataPoints.map(data => data.price) // time-series prices of potential pair
        const correlation = sampleCorrelation(targetPrices, pairPrices)
        // finding the most correlated pair
        if (correlation > bestCorrelated.correlation) {
            bestCorrelated.symbol = symbol
            bestCorrelated.dataPoints = dataPoints
            bestCorrelated.correlation = correlation
        }
    }

    const pairPrices = bestCorrelated.dataPoints.map(data => data.price)
    
    // const priceSpread = subtract(targetPrices, pairPrices)
    let priceSpread = []

    for (let i = 0; i < targetPrices.length; i++) {
        priceSpread.push(targetPrices[i] - pairPrices[i])
    }

    const meanPriceSpread = mean(priceSpread)
    const sdPriceSpread = standardDeviation(priceSpread)

    let signals = []
    for (let i = 0; i < priceSpread.length; i++) {
        const zScore = (priceSpread[i] - meanPriceSpread) / sdPriceSpread

        let action = "E"
        if (zScore > 1) {
            action = "S-L"
        } else if (zScore < -1) {
            action = "L-S"
        }

        // don needa append if the current action equals the latest action
        if (signals.length === 0 || action !== signals[signals.length - 1].action) {
            signals.push(
                { 
                    date: dataPoints[i].date,
                    priceTarget: dataPoints[i].price,
                    pricePair: bestCorrelated.dataPoints[i].price,
                    priceSpread: priceSpread[i], 
                    action
                }
            )
        } 
    }

    const normal = { meanPriceSpread, sdPriceSpread, priceSpread }

    console.log(bestCorrelated)
    console.log(normal)
    console.log(signals)

    return { bestCorrelated, normal, signals }

}