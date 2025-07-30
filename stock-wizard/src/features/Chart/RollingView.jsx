import { useSelector } from 'react-redux'
import { useState, useEffect } from 'react'

// for the chart
import { Chart as ChartJS, CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import zoomPlugin from 'chartjs-plugin-zoom'
import annotationPlugin from 'chartjs-plugin-annotation'
import 'chartjs-adapter-luxon' // enabling the TimeScale to correctly parse and display dates on the x-axis

// for calculation
import { calcRollingStats } from '../../utils/calcStats'

// for modal messages
import '../Modal/Modal.css'
import Modal from '../Modal/Modal'

import './RollingView.css'

function RollingView() {

    // Register Chart JS components
    ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin, annotationPlugin)

    const { selectedSec, secData } = useSelector((state) => state.security)
    const [window, setWindow] = useState(10)

    // modal message
    const [momentumModal, setMomentumModal] = useState(false)
    const [volatilityModal, setVolatilityModal] = useState(false)


    const [rollingData, setRollingData] = useState(null)
    useEffect(() => {
        if (Object.keys(secData).length === 0 || !(Object.keys(secData).includes(selectedSec))) return
        setRollingData(calcRollingStats(secData[selectedSec], window))
    }, [secData, selectedSec, window])


    function getRollingData(symbol) {

        if (Object.keys(secData).length === 0 || !(Object.keys(secData).includes(symbol))) return
        const { rollingReturn, rollingVolatility } = rollingData

        return [
            {
                label: "Rolling Return",
                data: rollingReturn,
                parsing: { xAxisKey: "date", yAxisKey: "rate" },
                borderColor: "black",
                tension: 0, // no smoothing the curve
            }, 

            {
                label: "Rolling Volatility",
                data: rollingVolatility,
                parsing: { xAxisKey: "date", yAxisKey: "rate" },
                borderColor: "red",
                tension: 0, // no smoothing the curve
            }
        ]
    }


    return (
        <>
        {rollingData !== null && (
            <div className="rolling-chart">

                <h3>Rolling Analytics</h3>

                <Line
                    className="chart"
                    data={{ datasets: getRollingData(selectedSec) }}
                    options={{
                        responsive: true,
                        aspectRatio: 2,
                        plugins: {
                            title: {
                                display: true,
                                text: "Rolling Analytics"
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
                            }
                        },
                        scales: {
                            x: {
                                type: "time",
                                ticks: { maxTicksLimit: 10 },
                                min: new Date(Date.now() - 2592000000 * 3).toISOString(),
                                max: new Date().toISOString()
                            },
                            y: {
                                beginAtZero: true
                            }
                        }
                    }}
                    height={400}
                />

                <div className="window">
                    <div className={window === 5 ? "option shade" : "option"} onClick={() => setWindow(5)}>5 Day Window</div>
                    <div className={window === 10 ? "option shade" : "option"} onClick={() => setWindow(10)}>10 Day Window</div>
                </div>

                <div className="horizontal-display"  style={ { marginTop: "auto", marginBottom: "16px" } }>
                    <div className="vertical-display">
                        <h3>Momentum Profile</h3>
                        <div className="tooltip">
                            {momentumModal && (
                                <Modal 
                                    modalContent={
                                        <div className="modal-content">
                                            {`The stock's recent return is ${rollingData.momentumScore >= 50 ? `higher than ${rollingData.momentumScore}%` : `lower than ${100 - rollingData.momentumScore}%`} of its historical performance.`}
                                        </div>
                                    }
                                />
                            )}

                            <div 
                                className="score-bar-container"
                                onMouseEnter={() => setMomentumModal(true)}
                                onMouseLeave={() => setMomentumModal(false)}
                            >
                                <div 
                                    className="score-bar" 
                                    style={ 
                                        { 
                                            width: `${rollingData.momentumScore}%`, 
                                            backgroundColor: `${rollingData.momentumScore >= 70 ? "#B6D7A8" : rollingData.momentumScore >= 40 ? "#FFE599" : "#E06666"}`
                                        } 
                                    }
                                >
                                </div>

                                <div className="score-number">{rollingData.momentumScore}%</div>

                            </div>
                        </div>   
                    </div>

                    <div className="vertical-display">
                        <h3>Risk Profile</h3>
                        
                        <div className="tooltip">
                            {volatilityModal && (
                                <Modal 
                                    modalContent={
                                        <div className="modal-content">
                                            {`The stock is currently ${rollingData.riskScore >= 50 ? `less volatile than ${rollingData.riskScore}%` : `more volatile than ${100 - rollingData.riskScore}%`} of its historical performance.`}
                                        </div>
                                    }
                                />
                            )}

                            <div 
                                className="score-bar-container"
                                onMouseEnter={() => setVolatilityModal(true)}
                                onMouseLeave={() => setVolatilityModal(false)}
                            >
                                <div 
                                    className="score-bar" 
                                    style={ 
                                        { 
                                            width: `${rollingData.riskScore}%`, 
                                            backgroundColor: `${rollingData.riskScore >= 70 ? "#B6D7A8" : rollingData.riskScore >= 40 ? "#FFE599" : "#E06666"}`
                                        } 
                                    }
                                >
                                </div>

                                <div className="score-number">{rollingData.riskScore}%</div>

                            </div>
                        </div>                
                        
                    </div>
                </div>



            </div>
        )}
        </>
    )

}

export default RollingView