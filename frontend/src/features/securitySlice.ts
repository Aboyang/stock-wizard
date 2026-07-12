import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface ISecurityState {
    symbols: string[]
    selectedSec: string
}

const initialState: ISecurityState = {
    symbols: ['TSLA'],
    selectedSec: 'TSLA',
}

const securitySlice = createSlice({

    name: "security",
    initialState,

    reducers: {

        addSymbol: (state, action: PayloadAction<string>) => {
            state.symbols.push(action.payload)
            if (state.selectedSec === '') state.selectedSec = action.payload
        },

        removeSec: (state, action: PayloadAction<{ symbol: string; index: number }>) => {
            state.symbols.splice(action.payload.index, 1)
            if (state.selectedSec === action.payload.symbol) state.selectedSec = state.symbols[0] ?? ''
        },

        selectSec: (state, action: PayloadAction<string>) => {
            state.selectedSec = action.payload
        }
    },
})

export default securitySlice.reducer
export const addSymbol = securitySlice.actions.addSymbol
export const removeSec = securitySlice.actions.removeSec
export const selectSec = securitySlice.actions.selectSec
