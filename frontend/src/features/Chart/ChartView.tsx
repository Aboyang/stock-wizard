import { useAppSelector } from '../../app/hooks'

import { Chart as ChartJS, CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Filler, Title, Tooltip, Legend } from 'chart.js'
import type { ChartData, ChartOptions, ScriptableContext } from 'chart.js'
import { Line } from 'react-chartjs-2'
import zoomPlugin from 'chartjs-plugin-zoom'
import annotationPlugin from 'chartjs-plugin-annotation'
import 'chartjs-adapter-luxon'

import { useGetChart } from '../Card/query'
import type { IPricePoint } from '../Card/query'

import './ChartView.css'
import MAView from './MAView'
import RollingView from './RollingView'
import PairView from './PairView'
import NewsView from './NewsView'
import ProfileView from './ProfileView'

function hexToRgba(hex: string, alpha: number) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function ChartView() {

    ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Filler, Title, Tooltip, Legend, zoomPlugin, annotationPlugin)

    const selectedSec = useAppSelector((state) => state.security.selectedSec)

    const { data: points = [] } = useGetChart(selectedSec)

    const delta = points.length ? points[points.length - 1].price - points[0].price : 0
    const lineColor = delta > 0 ? '#16A34A' : delta < 0 ? '#DC2626' : '#9CA3AF'

    const datasets = [{
        label: selectedSec,
        data: points,
        parsing: { xAxisKey: "date", yAxisKey: "price" },
        borderColor: lineColor,
        fill: 'origin',
        backgroundColor: (context: ScriptableContext<'line'>) => {
            const { ctx, chartArea } = context.chart
            if (!chartArea) return hexToRgba(lineColor, 0.15)
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
            gradient.addColorStop(0, hexToRgba(lineColor, 0.35))
            gradient.addColorStop(1, hexToRgba(lineColor, 0))
            return gradient
        },
        tension: 0,
    }]

    const data: ChartData<'line', IPricePoint[]> = { datasets }

    const options: ChartOptions<'line'> = {
        responsive: true,
        aspectRatio: 2.5,
        plugins: {
            title: { display: true, text: `${selectedSec} — Closing Price` },
            legend: { display: false },
        },
        scales: {
            x: { type: "time", ticks: { maxTicksLimit: 20 } },
            y: { beginAtZero: false },
        }
    }

    return (
        <>
            <div className="chart-area">
                {points.length === 0 ? (
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
