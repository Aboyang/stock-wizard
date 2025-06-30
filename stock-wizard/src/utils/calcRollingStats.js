import { standardDeviation } from 'simple-statistics'

export function calculateRollingStats(dataPoints, window) {

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

    return { rollingReturn, rollingVolatility }
}
