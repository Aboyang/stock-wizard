import { useSelector, useDispatch } from "react-redux"
import { addSymbol, fetchData, clearSecs } from "../securitySlice"
import { changeTimeframe } from "../Form/formSlice"
import { useEffect, useState, useRef } from "react"
import axios from "axios"

import './FormView.css'

function FormView() {

    // for the search bar
    const [symbol, setSymbol] = useState('')
    const [suggestion, setSuggestion] = useState([])

    // redux
    const { symbols } = useSelector((state) => state.security)
    const { timeframe } = useSelector((state) => state.form)
    const dispatch = useDispatch()

    const run = useRef(false)

    // handle onclick for adding stock
    function handleAddSec(symbol) {
        if (symbols.includes(symbol)) return // prevent repetition

        dispatch(addSymbol(symbol))
        dispatch(fetchData(symbol))
        
        setSymbol('')
    }

    // every data needa be re-fetched whenever one of the parameters (interval, start, end) changes
    useEffect(() => {

        if (run.current) return

        dispatch(clearSecs())

        for (let symbol of symbols) {

            // make sure the data of the current symbol is fetched and stored before proceeding to fetch the next
            async function fetchBySymbol(){
                await dispatch(fetchData(symbol))  
            }

            fetchBySymbol(symbol)
        }

        run.current = true

    }, [timeframe])


    // search bar
    useEffect(() => {

        if (symbol === "") {

            if (suggestion.length === 0) {
                return
            } 

            setSuggestion([])
            return
        }

        axios.get(`https://stock-wizard-server.onrender.com/api/suggestion?search=${symbol}`).then(response => setSuggestion(response.data))

    }, [symbol])

    



    return (
        <div className="setting">

            <div className="title-container">
                <h3 className="title">Stock Wizard</h3>
            </div>

            <div className="symbol-container">
                <input className="text" type="text" placeholder="TSLA" value={symbol} onChange={(e) => setSymbol(e.target.value)}/>
                <div className="btn" onClick={() => handleAddSec(symbol)}><i className="icon fa-solid fa-magnifying-glass"></i></div>
            </div>

            {suggestion.length > 0 && (
                <div className="suggestions">
                    {suggestion.map((symb, index) => (<div className="suggestion" key={index} onClick={() => {

                        handleAddSec(symb)
                        setSymbol('')
                        setSuggestion([])
                        
                    }}>{symb}

                </div>
                    ))}
                </div>
            )}
            
            <select className="menu" value={timeframe || ""} onChange={(e) => {
                dispatch(changeTimeframe(e.target.value))
                run.current = false
            }}>
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