import { useState } from 'react'
import { useAppSelector } from '../../app/hooks'

import { Chart as ChartJS, CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import type { ChartDataset } from 'chart.js'
import { Line } from 'react-chartjs-2'
import zoomPlugin from 'chartjs-plugin-zoom'
import annotationPlugin from 'chartjs-plugin-annotation'
import type { AnnotationOptions } from 'chartjs-plugin-annotation'
import 'chartjs-adapter-luxon'

import './MAView.css'

import Modal from '../Modal/Modal'
import '../Modal/Modal.css'
import { useGetMovingAverage } from './query'
import type { IPricePoint } from '../Card/query'

function MAView() {

    ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin, annotationPlugin)

    const selectedSec = useAppSelector((state) => state.security.selectedSec)
    const [window, setWindow] = useState(5)
    const [showModal, setShowModal] = useState(false)

    const { data: movingAvgData } = useGetMovingAverage(selectedSec, window)

    if (!movingAvgData) return null

    const { fastMA, slowMA, crossover } = movingAvgData

    const datasets: ChartDataset<'line', IPricePoint[]>[] = [
        {
            label: `${window}-Day Moving Average`,
            data: fastMA,
            parsing: { xAxisKey: "date", yAxisKey: "price" },
            borderColor: "black",
            tension: 0,
        },
        {
            label: `${window * 2}-Day Moving Average`,
            data: slowMA,
            parsing: { xAxisKey: "date", yAxisKey: "price" },
            borderColor: "red",
            tension: 0,
        }
    ]

    const annotations: Record<string, AnnotationOptions> = Object.fromEntries(
        crossover.map((d, index): [string, AnnotationOptions] => [
            `label${index + 1}`,
            {
                type: 'label',
                xValue: d.date,
                yValue: d.price,
                content: [d.signal, d.date.split('T')[0], d.price.toFixed(2)],
                backgroundColor: d.signal === "buy" ? "green" : "red",
                color: 'white',
                font: { size: 8 },
                xAdjust: 0,
                yAdjust: -10,
                borderRadius: 8
            }
        ])
    )

    const latest = [...crossover].reverse()[0]

    return (
        <div className="vertical-display">
            <div className="ma-chart">
                <h3>Moving Averages</h3>
                <div className="chart-container">
                <Line
                    className="chart"
                    data={{ datasets }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: { display: true, text: "Moving Averages" },
                            legend: { position: "bottom" },
                            zoom: {
                                pan: { enabled: true, mode: "x", threshold: 50 },
                                zoom: {
                                    wheel: { enabled: true, speed: 0.005 },
                                    pinch: { enabled: false },
                                    mode: "x"
                                }
                            },
                            annotation: { annotations }
                        },
                        scales: {
                            x: {
                                type: "time",
                                ticks: { maxTicksLimit: 10 },
                                min: new Date(Date.now() - 2592000000 * 3).toISOString(),
                                max: new Date().toISOString()
                            }
                        }
                    }}
                />
                </div>

                <div className="window">
                    <div className={window === 5 ? "option shade" : "option"}onClick={() => setWindow(5)}>5 Day Window</div>
                    <div className={window === 10 ? "option shade" : "option"} onClick={() => setWindow(10)}>10 Day Window</div>
                </div>
            </div>

            {latest && (
                <div className="crossover-card">
                    <div className="tooltip">
                        {showModal && (
                            <Modal
                                modalContent={
                                    <div className="modal-content">
                                        <strong>Crossover Moving Average Strategy</strong>
                                        <p>A trend-following signal. A <strong>bullish crossover</strong> happens when the short-term MA crosses above the long-term MA (buy signal); a <strong>bearish crossover</strong> occurs when it crosses below (sell signal).</p>
                                    </div>
                                }
                            />
                        )}
                        <h3
                            onMouseEnter={() => setShowModal(true)}
                            onMouseLeave={() => setShowModal(false)}
                        >
                            Moving Average Crossover Strategy
                        </h3>
                    </div>

                    <div className="card-content">
                        <div className={latest.signal === "buy" ? "signal buy" : "signal sell"}>
                            {latest.signal}
                        </div>
                        <div className="data">
                            <div>
                                {latest.signal === "buy" ? "Slow moving average crosses fast moving average " : "Fast moving average crosses slow moving average "}
                                <strong>{`${((Date.now() - new Date(latest.date).getTime()) / 1000 / 60 / 60 / 24).toFixed(0)} days`}</strong>
                                {" ago on "}
                                <strong>{latest.date.split('T')[0]}</strong>
                                .
                            </div>
                            <div>
                                {"The stock was trading at the price of "}
                                <strong>${latest.price.toFixed(4)}</strong>
                                .
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

}

export default MAView
