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
        // {
        // bestCorrelated: {
        //     symbol: "GOOG",
        //     correlation: 0.9216940103774693,
        //     dataPoints: [
        //     { date: "2025-01-13T14:30:00.000Z", price: 192.2899932861328 },
        //     { date: "2025-01-14T14:30:00.000Z", price: 191.0500030517578 },
        //     { date: "2025-01-15T14:30:00.000Z", price: 196.97999572753906 },
        //     { date: "2025-01-16T14:30:00.000Z", price: 194.41000366210938 },
        //     { date: "2025-01-17T14:30:00.000Z", price: 197.5500030517578 },
        //     { date: "2025-07-09T13:30:00.000Z", price: 177.66000366210938 }
        //     ]
        // },
        // normal: {
        //     meanPriceSpread: 34.01377080698482,
        //     sdPriceSpread: 7.41382575158821,
        //     priceSpread: [
        //         34.01,
        //         41.42,
        //         26.60,
        //         30.30,
        //         38.70,
        //         34.80,
        //         20.77,
        //         48.30,
        //         31.00,
        //         36.50,
        //         28.00,
        //         42.90,
        //         35.10,
        //         33.20,
        //         25.30, 
        //         44.80, 
        //         38.00,
        //         39.70,
        //         29.10,
        //         34.30,
        //         31.50,
        //         40.00,
        //         36.80,
        //         23.60, 
        //         47.10,
        //         32.10,
        //         35.50,
        //         27.40,
        //         30.70,
        //         42.20
        //     ]
        // },
        // signals: [
        //     {
        //     date: "2025-01-13T14:30:00.000Z",
        //     price: 218.4600067138672,
        //     priceSpread: 26.170013427734375,
        //     zScore: -1.0579905223116604,
        //     action: "E"
        //     },
        //     {
        //     date: "2025-02-06T14:30:00.000Z",
        //     price: 238.8300018310547,
        //     priceSpread: 45.52000427246094,
        //     zScore: 1.55199674918327,
        //     action: "S-L"
        //     },
        //     {
        //     date: "2025-02-07T14:30:00.000Z",
        //     price: 229.14999389648438,
        //     priceSpread: 42.00999450683594,
        //     zScore: 1.0785556563880858,
        //     action: "E"
        //     },
        //     {
        //     date: "2025-02-11T14:30:00.000Z",
        //     price: 232.75999450683594,
        //     priceSpread: 45.68998718261719,
        //     zScore: 1.5749245756323655,
        //     action: "S-L"
        //     },
        //     {
        //     date: "2025-02-12T14:30:00.000Z",
        //     price: 228.92999267578125,
        //     priceSpread: 43.5,
        //     zScore: 1.2795322564713651,
        //     action: "E"
        //     },
        //     {
        //     date: "2025-04-14T13:30:00.000Z",
        //     price: 182.1199951171875,
        //     priceSpread: 20.649993896484375,
        //     zScore: -1.8025480174844444,
        //     action: "L-S"
        //     },
        //     {
        //     date: "2025-04-24T13:30:00.000Z",
        //     price: 186.5399932861328,
        //     priceSpread: 25.069992065429688,
        //     zScore: -1.2063648433656773,
        //     action: "E"
        //     },
        //     {
        //     date: "2025-05-05T13:30:00.000Z",
        //     price: 186.35000610351562,
        //     priceSpread: 20.300003051757812,
        //     zScore: -1.849755877023305,
        //     action: "L-S"
        //     },
        //     {
        //     date: "2025-05-07T13:30:00.000Z",
        //     price: 188.7100067138672,
        //     priceSpread: 35.910003662109375,
        //     zScore: 0.2557698169151515,
        //     action: "E"
        //     },
        //     {
        //     date: "2025-05-12T13:30:00.000Z",
        //     price: 208.63999938964844,
        //     priceSpread: 49.05999755859375,
        //     zScore: 2.0294821129813694,
        //     action: "S-L"
        //     },
        //     {
        //     date: "2025-05-14T13:30:00.000Z",
        //     price: 210.25,
        //     priceSpread: 43.44000244140625,
        //     zScore: 1.271439598159171,
        //     action: "E"
        //     },
        //     {
        //     date: "2025-07-07T13:30:00.000Z",
        //     price: 223.47000122070312,
        //     priceSpread: 45.910003662109375,
        //     zScore: 1.6046010863657147,
        //     action: "S-L"
        //     },
        //     {
        //     date: "2025-07-08T13:30:00.000Z",
        //     price: 219.36000061035156,
        //     priceSpread: 44.19999694824219,
        //     zScore: 1.3739500337022683,
        //     action: "E"
        //     }
        // ]
        // }




    const run = useRef(false)

    async function fetchRecommendedSec(symb) {
        if (Object.keys(secData).length === 0 || !(Object.keys(secData).includes(symb))) return

        let recommendedSecs = []

        let response = await axios.get(`http://localhost:5001/api/recommendation?symbol=${symb}`)
        const recommendations = response.data
        
        await new Promise(resolve => setTimeout(resolve, 2000)) // add some bit of delay otherwise hit rate limit LMFAO

        for (let rec of recommendations) {
            let response = await axios.get(`http://localhost:5001/api/sec?symbol=${rec}&start=${new Date(start).getTime()}&end=${new Date(end).getTime()}&interval=${interval}`)
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