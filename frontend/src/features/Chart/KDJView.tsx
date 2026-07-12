import { useState } from 'react'
import { useAppSelector } from '../../app/hooks'

import { Chart as ChartJS, CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import type { ChartDataset } from 'chart.js'
import { Line } from 'react-chartjs-2'
import zoomPlugin from 'chartjs-plugin-zoom'
import annotationPlugin from 'chartjs-plugin-annotation'
import type { AnnotationOptions } from 'chartjs-plugin-annotation'
import 'chartjs-adapter-luxon'

import './KDJView.css'

import Modal from '../Modal/Modal'
import '../Modal/Modal.css'
import { useGetKDJ } from './query'
import type { IRatePoint } from './query'

function KDJView() {

    ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin, annotationPlugin)

    const selectedSec = useAppSelector((state) => state.security.selectedSec)
    const [window, setWindow] = useState(9)
    const [showModal, setShowModal] = useState(false)

    const { data: kdjData } = useGetKDJ(selectedSec, window)

    if (!kdjData || kdjData.k.length === 0) return null

    const { k, d, j, latestK, latestD, latestJ, signal } = kdjData

    const datasets: ChartDataset<'line', IRatePoint[]>[] = [
        {
            label: "K",
            data: k,
            parsing: { xAxisKey: "date", yAxisKey: "rate" },
            borderColor: "black",
            tension: 0,
        },
        {
            label: "D",
            data: d,
            parsing: { xAxisKey: "date", yAxisKey: "rate" },
            borderColor: "red",
            tension: 0,
        },
        {
            label: "J",
            data: j,
            parsing: { xAxisKey: "date", yAxisKey: "rate" },
            borderColor: "#6050D4",
            tension: 0,
        }
    ]

    const annotations: Record<string, AnnotationOptions> = {
        overbought: {
            type: 'line',
            yMin: 80,
            yMax: 80,
            borderColor: 'red',
            borderWidth: 1,
            borderDash: [6, 6],
        },
        oversold: {
            type: 'line',
            yMin: 20,
            yMax: 20,
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
            <div className="kdj-chart">
                <h3>KDJ</h3>
                <div className="chart-container">
                <Line
                    className="chart"
                    data={{ datasets }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: { display: true, text: "KDJ Stochastic Oscillator" },
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
                            y: { suggestedMin: 0, suggestedMax: 100 }
                        }
                    }}
                />
                </div>

                <div className="window">
                    <div className={window === 9 ? "option shade" : "option"} onClick={() => setWindow(9)}>9 Day Window</div>
                    <div className={window === 14 ? "option shade" : "option"} onClick={() => setWindow(14)}>14 Day Window</div>
                </div>
            </div>

            <div className="kdj-card">
                <div className="tooltip">
                    {showModal && (
                        <Modal
                            modalContent={
                                <div className="modal-content">
                                    <strong>KDJ Stochastic Oscillator</strong>
                                    <p>A momentum indicator built on the stochastic oscillator. <strong>K</strong> tracks where the latest close sits within the recent price range, <strong>D</strong> smooths K, and <strong>J</strong> (3K − 2D) amplifies their divergence. K above <strong>80</strong> suggests <strong>overbought</strong>; below <strong>20</strong> suggests <strong>oversold</strong>. J moving beyond 100 or below 0 signals extremes.</p>
                                </div>
                            }
                        />
                    )}
                    <h3
                        onMouseEnter={() => setShowModal(true)}
                        onMouseLeave={() => setShowModal(false)}
                    >
                        KDJ Momentum Signal
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
                            {"-day KDJ reads K = "}
                            <strong>{latestK.toFixed(1)}</strong>
                            {", D = "}
                            <strong>{latestD.toFixed(1)}</strong>
                            {", J = "}
                            <strong>{latestJ.toFixed(1)}</strong>
                            .
                        </div>
                        <div>
                            {"Based on the 80/20 thresholds, "}
                            {interpretation}
                            .
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

}

export default KDJView
