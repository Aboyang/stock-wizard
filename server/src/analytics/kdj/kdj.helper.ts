import type { IDataPoint, IRatePoint } from "../analytics.helper.js"

export type TKDJSignal = "overbought" | "oversold" | "neutral"

export interface IKDJResult {
    k: IRatePoint[]
    d: IRatePoint[]
    j: IRatePoint[]
    latestK: number
    latestD: number
    latestJ: number
    signal: TKDJSignal
}

// close-only KDJ: RSV uses the highest/lowest close over the window
// (posted dataPoints carry closing prices only, no intraday high/low)
export function calcKDJ(dataPoints: IDataPoint[], window: number = 9): IKDJResult {

    const prices = dataPoints.map(data => data.price)
    const dates = dataPoints.map(data => data.date)

    if (prices.length < window) {
        return { k: [], d: [], j: [], latestK: NaN, latestD: NaN, latestJ: NaN, signal: "neutral" }
    }

    const round = (x: number) => parseFloat(x.toFixed(2))

    const k: IRatePoint[] = []
    const d: IRatePoint[] = []
    const j: IRatePoint[] = []

    // K and D seed at the neutral value 50, then smooth with 2/3 : 1/3 weights
    let prevK = 50
    let prevD = 50

    for (let i = window - 1; i < prices.length; i++) {
        const thisWindow = prices.slice(i - window + 1, i + 1)
        const highest = Math.max(...thisWindow)
        const lowest = Math.min(...thisWindow)

        const rsv = highest === lowest ? 50 : (prices[i] - lowest) / (highest - lowest) * 100

        prevK = (2 / 3) * prevK + (1 / 3) * rsv
        prevD = (2 / 3) * prevD + (1 / 3) * prevK

        k.push({ date: dates[i], rate: round(prevK) })
        d.push({ date: dates[i], rate: round(prevD) })
        j.push({ date: dates[i], rate: round(3 * prevK - 2 * prevD) })
    }

    const latestK = k[k.length - 1].rate
    const latestD = d[d.length - 1].rate
    const latestJ = j[j.length - 1].rate
    const signal: TKDJSignal = latestK > 80 ? "overbought" : latestK < 20 ? "oversold" : "neutral"

    return { k, d, j, latestK, latestD, latestJ, signal }
}
