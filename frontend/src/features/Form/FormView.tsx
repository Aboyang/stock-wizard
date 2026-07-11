import { useState } from "react"
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import { addSymbol } from "../securitySlice"
import { changeTimeframe } from "./formSlice"
import type { TTimeframe } from "./formSlice"
import { useGetSuggestions } from "./query"

import './FormView.css'

function FormView() {

    const [symbol, setSymbol] = useState('')

    const { symbols } = useAppSelector((state) => state.security)
    const { timeframe } = useAppSelector((state) => state.form)
    const dispatch = useAppDispatch()

    const { data: suggestion = [] } = useGetSuggestions(symbol)

    function handleAddSec(symb: string) {
        if (symbols.includes(symb)) return
        dispatch(addSymbol(symb))
        setSymbol('')
    }

    return (
        <div className="setting">

            <div className="title-container">
                <h3 className="title">Stock Wizard</h3>
            </div>

            <div className="symbol-container">
                <input className="text" type="text" placeholder="TSLA" value={symbol} onChange={(e) => setSymbol(e.target.value)}/>
                <div className="btn" onClick={() => handleAddSec(symbol)}><i className="icon fa-solid fa-magnifying-glass"></i></div>
            </div>

            {symbol && suggestion.length > 0 && (
                <div className="suggestions">
                    {suggestion.map((symb, index) => (
                        <div className="suggestion" key={index} onClick={() => {
                            handleAddSec(symb)
                            setSymbol('')
                        }}>{symb}</div>
                    ))}
                </div>
            )}

            <select className="menu" value={timeframe || ""} onChange={(e) => dispatch(changeTimeframe(e.target.value as TTimeframe))}>
                <option value="1m">1 Month</option>
                <option value="3m">3 Months</option>
                <option value="6m">6 Months</option>
                <option value="1y">1 Year</option>
                <option value="2y">2 Year</option>
            </select>

        </div>
    )
}

export default FormView
