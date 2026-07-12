import { useEffect, useMemo, useRef } from "react"
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import { removeSec, selectSec } from "../securitySlice"
import { mergeSnapshot } from "../analysisSlice"
import { useGetChart } from "./query"
import { calcCardMetrics } from "./metrics"

import "./CardView.css"

interface ICardViewProps {
    symbol: string
    index: number
    isEditMode: boolean
    enterEditMode: () => void
}

function CardView({ symbol, index, isEditMode, enterEditMode }: ICardViewProps) {

    const selectedSec = useAppSelector((state) => state.security.selectedSec)
    const interval = useAppSelector((state) => state.form.interval)
    const dispatch = useAppDispatch()

    const { data: priceData, isLoading } = useGetChart(symbol)

    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pointerStart = useRef({ x: 0, y: 0 })
    const movedTooMuch = useRef(false)

    function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
        movedTooMuch.current = false
        pointerStart.current = { x: e.clientX, y: e.clientY }
        longPressTimer.current = setTimeout(() => {
            longPressTimer.current = null
            enterEditMode()
        }, 500)
    }

    function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
        const dx = e.clientX - pointerStart.current.x
        const dy = e.clientY - pointerStart.current.y
        if (dx * dx + dy * dy > 64) {
            movedTooMuch.current = true
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current)
                longPressTimer.current = null
            }
        }
    }

    function cancelLongPress() {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
            longPressTimer.current = null
        }
    }

    function handleClick() {
        if (isEditMode) return
        if (movedTooMuch.current) return
        dispatch(selectSec(symbol))
    }

    function handleRemove(e: React.MouseEvent<HTMLButtonElement>) {
        e.stopPropagation()
        dispatch(removeSec({ symbol, index }))
    }

    const metrics = useMemo(
        () => (priceData ? calcCardMetrics(priceData, interval) : null),
        [priceData, interval]
    )

    // mirror the client-computed metrics into the analysis snapshot
    useEffect(() => {
        if (metrics) dispatch(mergeSnapshot({ symbol, data: { metrics } }))
    }, [metrics, symbol, dispatch])

    const cardClass =
        (selectedSec === symbol ? "card selected" : "card") +
        (isEditMode ? " wiggle" : "")

    return (
        <div
            className={cardClass}
            style={isEditMode ? { animationDelay: `${(index % 5) * 0.07}s` } : undefined}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={cancelLongPress}
            onPointerLeave={cancelLongPress}
            onPointerCancel={cancelLongPress}
            onClick={handleClick}
        >

            {isEditMode && (
                <button className="remove-btn" onClick={handleRemove} aria-label={`Remove ${symbol}`}>
                    <i className="fa-solid fa-xmark" />
                </button>
            )}

            <div className="symbol">{symbol}</div>

            {!metrics ? (
                <button className="loading-button" disabled>{isLoading ? "Loading..." : "No data"}</button>
            ) : (
                <>
                    <div className="metric">
                    <div className="label">Return</div>:
                    <div
                        className={
                        metrics.annualReturn < 0
                            ? "value red"
                            : metrics.annualReturn < 0.05
                            ? "value orange"
                            : "value green"
                        }
                    >
                        {(metrics.annualReturn * 100).toFixed(2)}%
                    </div>
                    </div>

                    <div className="metric">
                    <div className="label">Volatility</div>:
                    <div
                        className={
                        metrics.annualVolatility < 0.1
                            ? "value green"
                            : metrics.annualVolatility < 0.3
                            ? "value orange"
                            : "value red"
                        }
                    >
                        {(metrics.annualVolatility * 100).toFixed(2)}%
                    </div>
                    </div>

                    <div className="metric">
                    <div className="label">Sharpe</div>:
                    <div
                        className={
                        metrics.sharpe < 0
                            ? "value red"
                            : metrics.sharpe < 1
                            ? "value orange"
                            : "value green"
                        }
                    >
                        {metrics.sharpe.toFixed(2)}
                    </div>
                    </div>

                </>
            )}

        </div>
    )
}

export default CardView
