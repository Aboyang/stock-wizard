import { useAppSelector } from "../../app/hooks"

import { Chart as ChartJS, CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import type { ChartDataset } from 'chart.js'
import { Line } from 'react-chartjs-2'
import zoomPlugin from 'chartjs-plugin-zoom'
import annotationPlugin from 'chartjs-plugin-annotation'
import type { AnnotationOptions } from 'chartjs-plugin-annotation'
import 'chartjs-adapter-luxon'

import '../Chart/ChartView.css'
import './PairView.css'

import { useGetChart } from '../Card/query'
import type { IPricePoint } from '../Card/query'
import { useGetMeanReversion } from './query'

interface ISpreadPoint {
    priceSpread: number
    dist: number
}

function PairView() {

    ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin, annotationPlugin)

    const selectedSec = useAppSelector(state => state.security.selectedSec)

    const { data: targetChart } = useGetChart(selectedSec)
    const { data: meanReversionData, isLoading } = useGetMeanReversion(selectedSec)

    if (isLoading || !meanReversionData || !meanReversionData.bestCorrelated) {
        return <div className="loading">Loading mean-reversion data...</div>
    }

    const { bestCorrelated, signals, normal } = meanReversionData

    const getPairData = (): ChartDataset<'line', IPricePoint[]>[] => [
        {
            label: bestCorrelated.symbol || "-",
            data: bestCorrelated.dataPoints || [],
            parsing: { xAxisKey: "date", yAxisKey: "price" },
            borderColor: "black",
            tension: 0,
        },
        {
            label: selectedSec,
            data: targetChart || [],
            parsing: { xAxisKey: "date", yAxisKey: "price" },
            borderColor: "red",
            tension: 0,
        }
    ]

    const getSignal = (): Record<string, AnnotationOptions> => Object.fromEntries(
        signals.map((data, index): [string, AnnotationOptions] => [
            `label${index + 1}`,
            {
                type: 'label',
                xValue: data.date,
                yValue: data.priceTarget,
                content: [
                    data.action,
                    `Spread: ${data.priceSpread?.toFixed(2)}`,
                    `${selectedSec}: ${data.priceTarget?.toFixed(2)}`,
                    `${bestCorrelated.symbol}: ${data.pricePair?.toFixed(2)}`,
                    data.date.split('T')[0]
                ],
                backgroundColor: data.action === "E" ? "red" : "green",
                color: 'white',
                font: { size: 8 },
                xAdjust: 0,
                yAdjust: -10,
                borderRadius: 8
            }
        ])
    )

    const latestSignal = signals.length > 0 ? [...signals].reverse()[0] : null

    const getNormalDist = (): ChartDataset<'line', ISpreadPoint[]>[] => {
        if (!normal.priceSpread) return []
        const { priceSpread, meanPriceSpread, sdPriceSpread } = normal
        const normalPDF = (x: number, mean: number, sd: number): number => (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / sd, 2))

        const distributions = [...priceSpread].sort((a, b) => a - b).map(x => ({ priceSpread: x, dist: normalPDF(x, meanPriceSpread, sdPriceSpread) }))

        return [{ data: distributions, parsing: { xAxisKey: "priceSpread", yAxisKey: "dist" }, borderColor: "black", tension: 0 }]
    }

    const getSpreadData = (): ChartDataset<'line', { date: string | undefined; price: number }[]>[] => {
        if (!normal.priceSpread || !targetChart) return []
        const { priceSpread } = normal
        const priceSpreadTimeSeries = priceSpread.map((p, i) => ({ date: targetChart[i]?.date, price: p }))
        return [{ data: priceSpreadTimeSeries, parsing: { xAxisKey: "date", yAxisKey: "price" }, borderColor: "black", tension: 0 }]
    }

    const latestSpread = normal.priceSpread && normal.priceSpread.length > 0 ? [...normal.priceSpread].reverse()[0] : null

    return (
        <div className="horizontal-display">

            <div className="vertical-display" style={{ width: "30%" }}>

                <div className="correlation-info">
                    <h3>Best Correlated Symbol</h3>
                    <div className="correlation-metrics">
                        <div className="pair-symbol">{bestCorrelated.symbol}</div>
                        <div className="correlation" style={{
                            backgroundColor: `${bestCorrelated.correlation >= 0.8 ? "#B6D7A8" : bestCorrelated.correlation >= 0.6 ? "#FFE599" : "#E06666"}`
                        }}>
                            {bestCorrelated.correlation?.toFixed(2)}
                        </div>
                    </div>
                </div>

                <div className="normal-chart">
                    <h3>Price Spread Distribution</h3>
                    <Line
                        className="chart"
                        data={{ datasets: getNormalDist() }}
                        options={{
                            responsive: true,
                            aspectRatio: 2,
                            plugins: { title: { display: true, text: "Price Spread Distribution" }, legend: { display: false } },
                            scales: { x: { type: "linear" } }
                        }}
                    />
                    {normal.meanPriceSpread && (
                        <div className="horizontal-display" style={{ justifyContent: "center" }}>
                            <div>Mean: {normal.meanPriceSpread.toFixed(2)}</div>
                            <div>Standard Deviation: {normal.sdPriceSpread.toFixed(2)}</div>
                        </div>
                    )}
                </div>

                <div className="spread-chart">
                    <h3>Price Spread Time Series</h3>
                    <Line
                        className="chart"
                        data={{ datasets: getSpreadData() }}
                        options={{
                            responsive: true,
                            aspectRatio: 2,
                            plugins: { title: { display: true, text: "Price Spread" }, legend: { display: false } },
                            scales: { x: { type: "time", ticks: { maxTicksLimit: 8 }, min: new Date(Date.now() - 2592000000 * 3).toISOString(), max: new Date().toISOString() } }
                        }}
                    />
                    <div>Latest Spread: {latestSpread?.toFixed(2)}</div>
                </div>

            </div>

            <div className="pair-chart">
                <h3>Pair Trading</h3>
                <Line
                    className="chart"
                    data={{ datasets: getPairData() }}
                    options={{
                        responsive: true,
                        aspectRatio: 1.5,
                        plugins: {
                            title: { display: true, text: "Pair Trading" },
                            legend: { position: "bottom" },
                            zoom: { pan: { enabled: true, mode: "x", threshold: 50 }, zoom: { wheel: { enabled: true, speed: 0.005 }, pinch: { enabled: false }, mode: "x" } },
                            annotation: { annotations: getSignal() }
                        },
                        scales: { x: { type: "time", ticks: { maxTicksLimit: 10 }, min: new Date(Date.now() - 2592000000 * 3).toISOString(), max: new Date().toISOString() } }
                    }}
                />
                {latestSignal && (
                    <div className="latest-action">
                        <div className="card-content">
                            <div className={latestSignal.action === "E" ? "signal exit" : "signal enter"}>
                                {
                                    latestSignal.action === "E" ? "Exit" :
                                        latestSignal.action === "S-L" ? `Short ${selectedSec}, Long ${bestCorrelated.symbol}` :
                                            `Long ${selectedSec}, Short ${bestCorrelated.symbol}`
                                }
                            </div>
                            <div className="data">
                                <div>
                                    {latestSignal.action === "E" ? "A pair trading opportunity has ended on " : "This pair trading opportunity was identified on "}
                                    <strong>{latestSignal.date?.split('T')[0]}</strong>.
                                </div>
                                <div>
                                    {`${selectedSec} was trading at a price of `}
                                    <strong>{latestSignal.priceTarget?.toFixed(2)}</strong>
                                    {`; ${bestCorrelated.symbol} was trading at a price of `}
                                    <strong>{latestSignal.pricePair?.toFixed(2)}</strong>.
                                </div>
                                <div>
                                    {latestSignal.action === "E" ? "Don't enter the trade until the next signal." : "The signal is still active because the spread has not yet reverted to the mean."}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}

export default PairView
