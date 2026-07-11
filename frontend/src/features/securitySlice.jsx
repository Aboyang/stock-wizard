import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    symbols: ['TSLA'],
    selectedSec: '',
}

const securitySlice = createSlice({

    name: "security",
    initialState,

    reducers: {

        addSymbol: (state, action) => {
            state.symbols.push(action.payload)
        },

        removeSec: (state, action) => {
            state.symbols.splice(action.payload.index, 1)
        },

        selectSec: (state, action) => {
            state.selectedSec = action.payload
        }
    },
})

export default securitySlice.reducer
export const addSymbol = securitySlice.actions.addSymbol
export const removeSec = securitySlice.actions.removeSec
export const selectSec = securitySlice.actions.selectSec
