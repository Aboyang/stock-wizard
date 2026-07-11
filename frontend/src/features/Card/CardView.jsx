import { useSelector, useDispatch } from "react-redux"
import { useRef } from "react"
import { removeSec, selectSec } from "../securitySlice"
import { mean, standardDeviation } from "simple-statistics"
import { useGetChart } from "./query"

import "./CardView.css"

function CardView( { symbol, index, isEditMode, enterEditMode }) {

    const selectedSec = useSelector((state) => state.security.selectedSec)
    const interval = useSelector((state) => state.form.interval)
    const dispatch = useDispatch()

    const { data: priceData, isLoading } = useGetChart(symbol)

    const longPressTimer = useRef(null)
    const pointerStart = useRef({ x: 0, y: 0 })
    const movedTooMuch = useRef(false)

    function handlePointerDown(e) {
        movedTooMuch.current = false
        pointerStart.current = { x: e.clientX, y: e.clientY }
        longPressTimer.current = setTimeout(() => {
            longPressTimer.current = null
            enterEditMode()
        }, 500)
    }

    function handlePointerMove(e) {
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
        dispatch(selectSec(selectedSec === "" || selectedSec !== symbol ? symbol : ""))
    }

    function handleRemove(e) {
        e.stopPropagation()
        dispatch(removeSec({ symbol, index }))
    }

    let annualReturn = "-"
    let annualVolatility = "-"
    let sharpe = "-"

    const dataLoaded = !!priceData && priceData.length > 0

    if (dataLoaded) {

        let scale = 0
        switch (interval) {
            case '1d':
                scale = 252
                break
            case '1wk':
                scale = 52
                break
            case '1mo':
                scale = 12
                break
        }

        const prices = priceData.map(data => data.price)

        let percentChange = []
        for (let i = 1; i < prices.length; i ++) {
            percentChange.push((prices[i] / prices[i - 1] - 1))
        }

        annualReturn = mean(percentChange) * scale
        annualVolatility = standardDeviation(percentChange) * Math.sqrt(scale)
        sharpe = (annualReturn - 0.04) / annualVolatility
    }

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

            {!dataLoaded ? (
                <button className="loading-button" disabled>{isLoading ? "Loading..." : "No data"}</button>
            ) : (
                <>
                    <div className="metric">
                    <div className="label">Return</div>:
                    <div
                        className={
                        annualReturn < 0
                            ? "value red"
                            : annualReturn < 0.05
                            ? "value orange"
                            : "value green"
                        }
                    >
                        {(annualReturn * 100).toFixed(2)}%
                    </div>
                    </div>

                    <div className="metric">
                    <div className="label">Volatility</div>:
                    <div
                        className={
                        annualVolatility < 0.1
                            ? "value green"
                            : annualVolatility < 0.3
                            ? "value orange"
                            : "value red"
                        }
                    >
                        {(annualVolatility * 100).toFixed(2)}%
                    </div>
                    </div>

                    <div className="metric">
                    <div className="label">Sharpe</div>:
                    <div
                        className={
                        sharpe < 0
                            ? "value red"
                            : sharpe < 1
                            ? "value orange"
                            : "value green"
                        }
                    >
                        {sharpe.toFixed(2)}
                    </div>
                    </div>

                </>
            )}

        </div>
    )
}

export default CardView
