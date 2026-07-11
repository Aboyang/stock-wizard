import { useQueries } from '@tanstack/react-query'
import { useAppSelector } from '../../app/hooks'

import { Chart as ChartJS, CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import type { ChartData, ChartOptions } from 'chart.js'
import { Line } from 'react-chartjs-2'
import zoomPlugin from 'chartjs-plugin-zoom'
import annotationPlugin from 'chartjs-plugin-annotation'
import 'chartjs-adapter-luxon'

import { chartQueryOptions } from '../Card/query'
import type { IPricePoint } from '../Card/query'

import './ChartView.css'
import MAView from './MAView'
import RollingView from './RollingView'
import PairView from './PairView'
import NewsView from './NewsView'
import ProfileView from './ProfileView'

function ChartView() {

    ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin, annotationPlugin)

    const { symbols, selectedSec } = useAppSelector((state) => state.security)
    const { start, end, interval } = useAppSelector((state) => state.form)

    const displaySymbols = selectedSec !== "" ? [selectedSec] : symbols

    const queries = useQueries({
        queries: displaySymbols.map(s => chartQueryOptions(s, start, end, interval)),
    })

    const datasets = displaySymbols.map((label, i) => ({
        label,
        data: queries[i].data ?? [],
        parsing: { xAxisKey: "date", yAxisKey: "price" },
        borderColor: ['#6050D4', 'red', 'green', 'blue', 'orange', 'lightblue'][symbols.findIndex(symb => symb === label)],
        tension: 0,
    }))

    const data: ChartData<'line', IPricePoint[]> = { datasets }

    const options: ChartOptions<'line'> = {
        responsive: true,
        aspectRatio: 2.5,
        plugins: {
            title: { display: true, text: "Closing Price Over Time" },
            legend: { position: "bottom" },
        },
        scales: {
            x: { type: "time", ticks: { maxTicksLimit: 20 } },
            y: { beginAtZero: false },
        }
    }

    const anyData = queries.some(q => q.data && q.data.length > 0)

    return (
        <>
            <div className="chart-area">
                {!anyData ? (
                    <div className="no-data"></div>
                ) : (
                    <Line className="chart" data={data} options={options} />
                )}
            </div>

            {selectedSec !== "" &&
                <>
                <ProfileView/>
                <NewsView/>
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
