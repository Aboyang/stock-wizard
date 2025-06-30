import { useSelector } from 'react-redux'
import { useState } from 'react'

// for the chart
import { Chart as ChartJS, CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import 'chartjs-adapter-luxon' // enabling the TimeScale to correctly parse and display dates on the x-axis

// for the rolling stats
import { calculateRollingStats } from '../../utils/calcRollingStats'

import './ChartView.css'

function windowChoice(interval) {

    switch (interval) {

        case "1d":
            return [
                { display: "5 Day Window", size: 5 },
                { display: "20 Day Window", size: 20 },
                { display: "60 Day Window", size: 60 }
            ]

        case "1wk":
            return [
                { display: "4 Week Window", size: 4 },
                { display: "12 Week Window", size: 12 },
                { display: "26 Week Window", size: 26 }
            ]
        
        case "1mo":
            return [
                { display: "1 Month Window", size: 1 },
                { display: "3 Month Window", size: 2 },
                { display: "6 Month Window", size: 6 }
            ]
    }

}

function ChartView() {

    // Register Chart JS components
    ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend)

    const { symbols, selectedSec, secData } = useSelector((state) => state.security)
    const { interval } = useSelector((state) => state.form)
    const [window, setWindow] = useState(windowChoice(interval)[0].size)

    // building up the datasets for line chart
    let datasets = []

    function buildDatasets(label) {

        const dataset = {
            label: label,
            data: secData[label],
            parsing: { xAxisKey: "date", yAxisKey: "price" },
            borderColor: ['#6050D4', 'red', 'green', 'blue', 'orange', 'lightblue'][symbols.findIndex(symb => symb === label)],
            tension: 0, // no smoothing the curve
        }

        datasets.push(dataset)

    }

    if (selectedSec !== "") {
        buildDatasets(selectedSec)
    } else if (selectedSec === "" && symbols.length > 0) {
        symbols.map((symbol) => buildDatasets(symbol))
    }

    // two arguments for <Line>
    const data = { datasets }

    const options = {

        responsive: true,

        aspectRatio: 2.5,

        plugins: {
            title: { display: true, text: "Closing Price Over Time" }, // chart title
            legend: { position: "bottom" }, // legends at bottom
        },
        
        scales: {
            x: { type: "time", ticks: { maxTicksLimit: 20 } },
            y: { beginAtZero: false },
        }
    }

    // THIS SECTION IS FOR ADVANCED ANALYTICS
    function getAdvancedAnalytics(symbol) {

        if (Object.keys(secData).length === 0 || !(Object.keys(secData).includes(symbol))) return

        const { rollingReturn, rollingVolatility } = calculateRollingStats(secData[symbol], window)

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
        <div className="chart-area">
            <Line className="chart" data={data} options={options} />
        </div>

        {selectedSec !== "" && (
            <div className="advanced-area">
                <Line className="chart" 
                
                    data={{ datasets: getAdvancedAnalytics(selectedSec) }} 
                    
                    options={{
                        responsive: true,

                        aspectRatio: 3,

                        plugins: {
                            title: { display: true, text: "Advanced Analytics" }, // chart title
                            legend: { position: "bottom" }, // legends at bottom
                        },
                        
                        scales: {
                            x: { type: "time", ticks: { maxTicksLimit: 20 } },
                            y: { beginAtZero: true },
                        }    
                    }} />

                <div className="window-choice">
                    {windowChoice(interval).map(choice => (<div key={choice.display} onClick={() => setWindow(choice.size)}>{choice.display}</div>))}
                </div>
                 
            </div>
        )}
        </>
        
    )
}

export default ChartView