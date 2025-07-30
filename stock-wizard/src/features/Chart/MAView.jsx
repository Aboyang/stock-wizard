import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'

// for the chart
import { Chart as ChartJS, CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import zoomPlugin from 'chartjs-plugin-zoom'
import annotationPlugin from 'chartjs-plugin-annotation'
import 'chartjs-adapter-luxon' // enabling the TimeScale to correctly parse and display dates on the x-axis

// for calculations
import { calcMovingAvg } from '../../utils/calcStats'

import './MAView.css'

// for tooltip
import Modal from '../Modal/Modal'
import '../Modal/Modal.css'

function MAView() {

    // Register Chart JS components
    ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin, annotationPlugin)

    const { selectedSec, secData } = useSelector((state) => state.security)
    const [window, setWindow] = useState(10)
    const [showModal, setShowModal] = useState(false)


    const [movingAvgData, setMovingAvgData] = useState(null)
    useEffect(() => {
        if (Object.keys(secData).length === 0 || !(Object.keys(secData).includes(selectedSec))) return
        setMovingAvgData(calcMovingAvg(secData[selectedSec], window))
    }, [secData, selectedSec, window])


    function getMovingAvg(symbol) {

        if (Object.keys(secData).length === 0 || !(Object.keys(secData).includes(symbol))) return

        const { fastMA, slowMA } = movingAvgData

        return [
            {
                label: `${window}-Day Moving Average`,
                data: fastMA,
                parsing: { xAxisKey: "date", yAxisKey: "price" },
                borderColor: "black",
                tension: 0, // no smoothing the curve
            }, 

            {
                label: `${window * 2}-Day Moving Average`,
                data: slowMA,
                parsing: { xAxisKey: "date", yAxisKey: "price" },
                borderColor: "red",
                tension: 0, // no smoothing the curve
            }
        ]
    }


    function getSignal() {
        const { crossover } = movingAvgData

        const annotations = Object.fromEntries(
            crossover.map((data, index) => [
                `label${index + 1}`,
                {
                    type: 'label',
                    xValue: data.date,
                    yValue: data.price,
                    content: [data.signal, data.date.split('T')[0], data.price.toFixed(2)],
                    backgroundColor: data.signal === "buy" ? "green" : "red",
                    color: 'white',
                    font: { size: 8 },
                    xAdjust: 0,
                    yAdjust: -10,
                    borderRadius: 8
                }
            ])
        )

        return annotations

    }


    return (
        <>
        {movingAvgData !== null && (
            <div className="vertical-display">
                <div className="ma-chart">
                    <h3>Moving Averages</h3>
                    <Line
                        className="chart"
                        data={{ datasets: getMovingAvg(selectedSec) }}
                        options={{
                        responsive: true,
                        aspectRatio: 2,
                        plugins: {
                            title: {
                            display: true,
                            text: "Moving Averages"
                            },
                            legend: {
                            position: "bottom"
                            },
                            zoom: {
                            pan: {
                                enabled: true,
                                mode: "x",
                                speed: 0.005,
                                threshold: 50
                            },
                            zoom: {
                                wheel: {
                                enabled: true,
                                speed: 0.005,
                                threshold: 50
                                },
                                pinch: { enabled: false },
                                mode: "x"
                            }
                            },
                            annotation: {
                            annotations: getSignal()
                            }
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
                        height={400}
                    />

                    <div className="window">
                        <div className={window === 5 ? "option shade" : "option"}onClick={() => setWindow(5)}>5 Day Window</div>
                        <div className={window === 10 ? "option shade" : "option"} onClick={() => setWindow(10)}>10 Day Window</div>
                    </div>
                    </div>

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

                        {(() => {
                            const { date, price, signal } = [...movingAvgData.crossover].reverse()[0]

                            return (
                            <div className="card-content">
                                <div className={signal === "buy" ? "signal buy" : "signal sell"}>
                                    {signal}
                                </div>
                                <div className="data">
                                    <div>
                                        {signal === "buy" ? "Slow moving average crosses fast moving average " : "Fast moving average crosses slow moving average "}
                                        <strong>{`${((Date.now() - new Date(date).getTime()) / 1000 / 60 / 60 / 24).toFixed(0)} days`}</strong>
                                        {" ago on "}
                                        <strong>{date.split('T')[0]}</strong>
                                        .
                                    </div>
                                    <div>
                                        {"The stock was trading at the price of "}
                                        <strong>${price.toFixed(4)}</strong>
                                        .
                                    </div>

                                </div>
                            </div>
                            )
                        })()}
                    </div>
            </div>
        )}

        </>
    )

}

export default MAView