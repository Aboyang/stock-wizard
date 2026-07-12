import { useState } from 'react'
import { useAppSelector } from '../../app/hooks'

import { Chart as ChartJS, CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import type { ChartDataset } from 'chart.js'
import { Line } from 'react-chartjs-2'
import zoomPlugin from 'chartjs-plugin-zoom'
import annotationPlugin from 'chartjs-plugin-annotation'
import type { AnnotationOptions } from 'chartjs-plugin-annotation'
import 'chartjs-adapter-luxon'

import './RSIView.css'

import Modal from '../Modal/Modal'
import '../Modal/Modal.css'
import { useGetRSI } from './query'
import type { IRatePoint } from './query'

function RSIView() {

    ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin, annotationPlugin)

    const selectedSec = useAppSelector((state) => state.security.selectedSec)
    const [window, setWindow] = useState(14)
    const [showModal, setShowModal] = useState(false)

    const { data: rsiData } = useGetRSI(selectedSec, window)

    if (!rsiData || rsiData.rsi.length === 0) return null

    const { rsi, latestRSI, signal } = rsiData

    const datasets: ChartDataset<'line', IRatePoint[]>[] = [
        {
            label: `${window}-Day RSI`,
            data: rsi,
            parsing: { xAxisKey: "date", yAxisKey: "rate" },
            borderColor: "#6050D4",
            tension: 0,
        }
    ]

    const annotations: Record<string, AnnotationOptions> = {
        overbought: {
            type: 'line',
            yMin: 70,
            yMax: 70,
            borderColor: 'red',
            borderWidth: 1,
            borderDash: [6, 6],
        },
        oversold: {
            type: 'line',
            yMin: 30,
            yMax: 30,
            borderColor: 'green',
            borderWidth: 1,
            borderDash: [6, 6],
        }
    }

    const interpretation =
        signal === "overbought" ? "the stock may be overbought" :
        signal === "oversold" ? "the stock may be oversold" :
        "the stock is trading in a neutral range"

    return (
        <div className="vertical-display">
            <div className="rsi-chart">
                <h3>RSI</h3>
                <Line
                    className="chart"
                    data={{ datasets }}
                    options={{
                        responsive: true,
                        aspectRatio: 2,
                        plugins: {
                            title: { display: true, text: "Relative Strength Index" },
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
                            },
                            y: { min: 0, max: 100 }
                        }
                    }}
                    height={400}
                />

                <div className="window">
                    <div className={window === 7 ? "option shade" : "option"} onClick={() => setWindow(7)}>7 Day Window</div>
                    <div className={window === 14 ? "option shade" : "option"} onClick={() => setWindow(14)}>14 Day Window</div>
                </div>
            </div>

            <div className="rsi-card">
                <div className="tooltip">
                    {showModal && (
                        <Modal
                            modalContent={
                                <div className="modal-content">
                                    <strong>Relative Strength Index</strong>
                                    <p>A momentum oscillator (Wilder's RSI) measuring the speed of recent price changes on a 0-100 scale. Readings above <strong>70</strong> suggest the stock is <strong>overbought</strong> (potential pullback); readings below <strong>30</strong> suggest it is <strong>oversold</strong> (potential rebound).</p>
                                </div>
                            }
                        />
                    )}
                    <h3
                        onMouseEnter={() => setShowModal(true)}
                        onMouseLeave={() => setShowModal(false)}
                    >
                        RSI Momentum Signal
                    </h3>
                </div>

                <div className="card-content">
                    <div className={`signal ${signal}`}>
                        {signal}
                    </div>
                    <div className="data">
                        <div>
                            {"The latest "}
                            <strong>{window}</strong>
                            {"-day RSI is "}
                            <strong>{latestRSI.toFixed(1)}</strong>
                            .
                        </div>
                        <div>
                            {"Based on the 70/30 thresholds, "}
                            {interpretation}
                            .
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

}

export default RSIView
