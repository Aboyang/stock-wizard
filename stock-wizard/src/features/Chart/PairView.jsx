import { useSelector } from "react-redux"
import { useState, useEffect } from "react"
import axios from "axios"
import { useRef } from "react"
import { calcMeanReversion } from "../../utils/calcStats"


// for the chart
import { Chart as ChartJS, CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import zoomPlugin from 'chartjs-plugin-zoom'
import annotationPlugin from 'chartjs-plugin-annotation'
import 'chartjs-adapter-luxon' // enabling the TimeScale to correctly parse and display dates on the x-axis

import '../Chart/ChartView.css'
import './PairView.css'

function PairView() {

    // Register Chart JS components
    ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin, annotationPlugin)

    const { secData, selectedSec } = useSelector((state) => state.security)
    const { start, end, interval } = useSelector((state) => state.form)
    const [meanReversionData, setMeanReversionData] = useState(null)

    const run = useRef(false)

    async function fetchRecommendedSec(symb) {
        if (Object.keys(secData).length === 0 || !(Object.keys(secData).includes(symb))) return

        let recommendedSecs = []

        let response = await axios.get(`https://stock-wizard-server.onrender.com/api/recommendation?symbol=${symb}`)
        const recommendations = response.data
        
        await new Promise(resolve => setTimeout(resolve, 2000)) // add some bit of delay otherwise hit rate limit LMFAO

        for (let rec of recommendations) {
            let response = await axios.get(`https://stock-wizard-server.onrender.com/api/sec?symbol=${rec}&start=${new Date(start).getTime()}&end=${new Date(end).getTime()}&interval=${interval}`)
            const dataPoints = response.data.map(dailyData => ({
                date: dailyData.date, 
                price: dailyData.close 
            }))
            recommendedSecs.push({ symbol: rec, dataPoints })

            await new Promise(resolve => setTimeout(resolve, 2000)) // add some bit of delay otherwise hit rate limit LMFAO

            console.log("hi")
        }

        return recommendedSecs
    }


    // fetch recommended pair & filter highly correlated ones
    useEffect(() => {

        const fetchMeanReversion = async () => {
            const recommendedSecs = await fetchRecommendedSec(selectedSec)
            setMeanReversionData(calcMeanReversion(secData[selectedSec], recommendedSecs))
        }

        if (run.current) return
        run.current = true
        fetchMeanReversion()

    }, [selectedSec, secData])

    if (meanReversionData) {console.log(meanReversionData)}

    function getCorrelationData() {
        const { bestCorrelated } = meanReversionData
        return bestCorrelated
    }

    function getPairData() {
        const { bestCorrelated } = meanReversionData
        return [
            {
                label: bestCorrelated.symbol,
                data: bestCorrelated.dataPoints,
                parsing: { xAxisKey: "date", yAxisKey: "price" },
                borderColor: "black",
                tension: 0, // no smoothing the curve
            }, 
            {
                label: selectedSec,
                data: secData[selectedSec],
                parsing: { xAxisKey: "date", yAxisKey: "price" },
                borderColor: "red",
                tension: 0, // no smoothing the curve
            }
        ]      
    }

    function getSignal() {
        const { signals } = meanReversionData

        const annotations = Object.fromEntries(
            signals.map((data, index) => [
                `label${index + 1}`,
                {
                    type: 'label',
                    xValue: data.date,
                    yValue: data.price,
                    content: [data.action, `Spread: ${data.priceSpread.toFixed(2)}`, `${selectedSec}: ${data.priceTarget.toFixed(2)}`, `${getCorrelationData().symbol}: ${data.pricePair.toFixed(2)}`, data.date.split('T')[0]],
                    backgroundColor: data.action === "E" ? "red" : "green",
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

    function getLatestSignal() {
        const { signals } = meanReversionData
        return [...signals].reverse()[0]
    }

    function getNormalData() {
        const { normal } = meanReversionData
        return normal
    }

    function getNormalDist() {
        const { normal } = meanReversionData
        const { priceSpread, meanPriceSpread, sdPriceSpread } = normal
        
        const normalPDF = (x, mean, sd) => {
            const coefficient = 1 / (sd * Math.sqrt(2 * Math.PI))
            const exponent = -0.5 * Math.pow((x - mean) / sd, 2)
            return coefficient * Math.exp(exponent)
        }

        let distributions = []
        for (let x of [...priceSpread].sort((a, b) => a - b)) {
            distributions.push({ priceSpread: x, dist: normalPDF(x, meanPriceSpread, sdPriceSpread) })
        }

        return [
            {
                data: distributions,
                parsing: { xAxisKey: "priceSpread", yAxisKey: "dist" },
                borderColor: "black",
                tension: 0, // no smoothing the curve
            }
        ]

    }

    function getSpreadData() {
        const { normal } = meanReversionData
        const { priceSpread } = normal

        let priceSpreadTimeSeries = []
        for (let i = 0; i < priceSpread.length; i++) {
            priceSpreadTimeSeries.push({ date: secData[selectedSec][i].date , price: priceSpread[i] })
        }

        return [
            {
                data: priceSpreadTimeSeries,
                parsing: { xAxisKey: "date", yAxisKey: "price" },
                borderColor: "black",
                tension: 0, // no smoothing the curve
            }
        ]
    }

    function getLatestSpread() {
        const { normal } = meanReversionData
        return [...normal.priceSpread].reverse()[0]
    }


    return (
        <>
        {meanReversionData !== null && (

            <div className="horizontal-display">

                <div className="vertical-display" style={ { width: "30%" } }>

                    <div className="correlation-info">
                        <h3>Best Correlated Symbol</h3>

                        <div className="correlation-metrics">
                            <div className="pair-symbol">{getCorrelationData().symbol}</div>
                            <div 
                                className="correlation"
                                style={ 
                                    {
                                        backgroundColor: `${getCorrelationData().correlation >= 80 ? "#E0666" : getCorrelationData().correlation >= 60 ? "#FFE599" : "#B6D7A86"}`
                                    } 
                                }
                            >
                                {getCorrelationData().correlation.toFixed(2)}
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
                            plugins: {
                                title: {
                                display: true,
                                text: "Price Spread Distribution"
                                },
                                legend: {
                                display: false,
                                }, 
                            }, 
                            scales: {
                                x: {
                                type: "linear"
                                }
                            }
                            }}
                        />
                        <div className="horizontal-display" style={{justifyContent: "center"}}>
                            <div>Mean: {getNormalData().meanPriceSpread.toFixed(2)}</div>
                            <div>Standard Deviation: {getNormalData().sdPriceSpread.toFixed(2)}</div>
                        </div>
                    </div>

                    <div className="spread-chart">
                        <h3>Price Spread Time Series</h3>
                        <Line
                            className="chart"
                            data={{ datasets: getSpreadData() }}
                            options={{
                            responsive: true,
                            aspectRatio: 2,
                            plugins: {
                                title: {
                                display: true,
                                text: "Price Spread"
                                },
                                legend: {
                                display: false
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
                            },
                            scales: {
                                x: {
                                type: "time",
                                ticks: { maxTicksLimit: 8 },
                                min: new Date(Date.now() - 2592000000 * 3).toISOString(),
                                max: new Date().toISOString()
                                }
                            }
                            }}
                        />
                        <div>Latest Spread: {getLatestSpread().toFixed(2)}</div>
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
                            title: {
                            display: true,
                            text: "Pair Trading"
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
                    />
                    <div className="latest-action">
                        <div className="card-content">
                            <div className={getLatestSignal().action === "E" ? "signal exit" : "signal enter"}>
                                {
                                    getLatestSignal().action === "E" ?
                                    "Exit" :
                                    getLatestSignal().action === "S-L" ?
                                    `Short ${selectedSec}, Long ${getCorrelationData().symbol}` :
                                    `Long ${selectedSec}, Short ${getCorrelationData().symbol}`
                                }
                            </div>
                            <div className="data">
                                <div>
                                    {
                                        getLatestSignal().action === "E" ?
                                        "A pair trading opportunity has ended on " :
                                        "This pair trading opportunity was identified on "
                                    }

                                    <strong>{getLatestSignal().date.split('T')[0]}</strong>
                                    .
                                </div>
                                <div>
                                    {`${selectedSec} was trading at a price of `}
                                    <strong>${getLatestSignal().priceTarget.toFixed(2)}</strong>
                                    {`; ${getCorrelationData().symbol} was trading at a price of `}
                                    <strong>${getLatestSignal().pricePair.toFixed(2)}</strong>.
                                </div>

                                <div>
                                    {
                                        getLatestSignal().action === "E" ?
                                        "Don't enter the trade until the next signal." :
                                        "The signal is still active because the spread has not yet reverted to the mean."
                                    }
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

            </div>
        )}
        </>
    )
}

export default PairView
