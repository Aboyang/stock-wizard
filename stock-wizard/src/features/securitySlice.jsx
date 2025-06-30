import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

const initialState = {

    symbols: ['TSLA'],
    secData: {},
    selectedSec: '',
    loading: false,
    error: false
}

export const fetchData = createAsyncThunk('security/fetchData', async (symbol, { getState } ) => {

    const state = getState().form

    const url = `http://localhost:5001/api/sec?symbol=${symbol}&start=${new Date(state.start).getTime()}&end=${new Date(state.end).getTime()}&interval=${state.interval}`
    
    const response = await axios.get(url)

    const priceData = response.data.map(dailyData => ({
        date: dailyData.date, 
        price: dailyData.close 
    }))

    return {
        symbol,
        priceData
    }

})

const securitySlice = createSlice({

    name: "security",
    initialState,

    reducers: {

        addSymbol: (state, action) => {
            state.symbols.push(action.payload)
        },

        removeSec: (state, action) => {
            state.symbols.splice(action.payload.index, 1)
            delete state.secData[action.payload.symbol]
        },

        clearSecs: (state) => {
            state.secData = {}
        },

        selectSec: (state, action) => {
            state.selectedSec = action.payload
        }
    },

    extraReducers: (build) => {

        build.addCase(fetchData.pending, (state) => {
            state.loading = true
        })

        build.addCase(fetchData.fulfilled, (state, action) => {
            state.loading = false
            state.secData[action.payload.symbol] = action.payload.priceData
        })

        build.addCase(fetchData.rejected, (state, action) => {
            state.loading = false
            state.error = action.error.message
        })
    }
})

export default securitySlice.reducer
export const addSymbol = securitySlice.actions.addSymbol
export const removeSec = securitySlice.actions.removeSec
export const clearSecs = securitySlice.actions.clearSecs
export const selectSec = securitySlice.actions.selectSec

