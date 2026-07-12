import { mean } from "simple-statistics"
import type { IDataPoint } from "../analytics.helper.js"

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
