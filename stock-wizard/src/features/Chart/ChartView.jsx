import { useSelector } from 'react-redux'

// for the chart
import { Chart as ChartJS, CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import zoomPlugin from 'chartjs-plugin-zoom'
import annotationPlugin from 'chartjs-plugin-annotation'
import 'chartjs-adapter-luxon' // enabling the TimeScale to correctly parse and display dates on the x-axis


import './ChartView.css'
import MAView from './MAView'
import RollingView from './RollingView'
import PairView from './PairView'

function ChartView() {

    // Register Chart JS components
    ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin, annotationPlugin)

    const { symbols, selectedSec, secData } = useSelector((state) => state.security)

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


    return (
        <>
            <div className="chart-area">
                <Line className="chart" data={data} options={options} />
            </div>

            {selectedSec !== "" &&
                <>
                <div className="horizontal-display">
                    <RollingView/>
                    <MAView/>
                </div>
                <PairView/>
                </>
            }


        </>
    )

}

export default ChartView