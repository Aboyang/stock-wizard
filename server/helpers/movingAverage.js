import { mean } from "simple-statistics"

export function calcMovingAvg(dataPoints, window = 5) {

    const prices = dataPoints.map(data => data.price)
    const dates = dataPoints.map(data => data.date)

    function movingAvg(w) {

        let ma = []
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
    let slowMA = movingAvg(window * 2)

    const offset = fastMA.length - slowMA.length
    fastMA = fastMA.slice(offset)


    // finding the crossover
    let crossover = []

    let prevDiff = fastMA[0].price - slowMA[0].price

    for (let i = 1; i < fastMA.length; i++) {

        const currentDiff = fastMA[i].price - slowMA[i].price
        if (currentDiff / prevDiff < 0) {

            const crossoverDate = fastMA[i].date
            const crossoverPrice = dataPoints.filter(data => data.date === crossoverDate)[0].price
            const signal = currentDiff > 0 ? "buy" : "sell"

            crossover.push({ date: crossoverDate, price: crossoverPrice, signal })
        }

        prevDiff = currentDiff
    }

    return { fastMA, slowMA, crossover }
}
