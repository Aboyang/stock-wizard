import { useSelector, useDispatch } from "react-redux"
import { removeSec, selectSec } from "../securitySlice"
import { mean, standardDeviation } from "simple-statistics"

import "./CardView.css"

function CardView( { symbol, index }) {

    // focus on card
    const selectedSec = useSelector((state) => state.security.selectedSec)

    // content on the card
    const secData = useSelector((state) => state.security.secData)
    const interval = useSelector((state) => state.form.interval)
    const dispatch = useDispatch()

    // default value
    let annualReturn = "-"
    let annualVolatility = "-"
    let sharpe = "-"

    // symbols would be stored in redux first before secData does, there is delay in fetching secData
    if (symbol in secData) {

        // PREPARATION: DETERMINING SCALING BASED ON DATA FREQ
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

        // PREPARATION: PREPARE PRICE DATA
        const prices = secData[symbol].map(data => data.price)
        
        // PREPARATION: CONVERT INTO % CHANGE
        let percentChange = []
        for (let i = 1; i < prices.length; i ++) {
            percentChange.push((prices[i] / prices[i - 1] - 1))
        }

        // METRIC 1: ANNUALIZED RETURN
        annualReturn = parseFloat((mean(percentChange) * scale).toFixed(2))

        // METRIC 2: ANNUALIZED VOLATILITY
        annualVolatility = parseFloat((standardDeviation(percentChange) * Math.sqrt(scale))).toFixed(2)

        // METRIC 3: SHARPE RATIO
        sharpe = parseFloat(((annualReturn - 0.04) / annualVolatility).toFixed(2))

    }

    return (
        <div 
            className={selectedSec === symbol? "card selected" : "card"} 

            onClick={() => {
                dispatch(selectSec(selectedSec === "" || selectedSec !== symbol ? symbol : ""))
            }}

            onDoubleClick={() => dispatch(removeSec({ symbol, index }))}
        >

            <div className="symbol">{symbol}</div>

            <div className="metric">
                <div className="label">Return</div>:
                <div className={annualReturn === "-" ? "value" : annualReturn < 0 ? "value red" : "value green"}> {annualReturn}</div>
            </div>

            <div className="metric">
                <div className="label">Volatility</div>:
                <div className={annualVolatility === "-" ? "value" :annualVolatility < 0 ? "value red" : "value green"}>{annualVolatility}</div>
            </div>

            <div className="metric">
                <div className="label">Sharpe</div>:
                <div className={sharpe === "-" ? "value" : sharpe < 0 ? "value red" : "value green"}>{sharpe}</div>
            </div>

        </div>
    )
}

export default CardView