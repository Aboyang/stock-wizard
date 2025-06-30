import { createSlice } from "@reduxjs/toolkit"

const initialState = {

    start: new Date(Date.now() - 2592000000).toISOString(),
    end: new Date(Date.now()).toISOString(),
    interval: '1d'

}

const formSlice = createSlice({

    name: "form",
    initialState,

    reducers: {

        changeStart: (state, action) => {
            state.start = action.payload
        },

        changeEnd: (state, action) => {
            state.end = action.payload
        },

        changeInterval: (state, action) => {
            state.interval = action.payload
        }
    }
})

export default formSlice.reducer
export const changeStart = formSlice.actions.changeStart
export const changeEnd = formSlice.actions.changeEnd
export const changeInterval = formSlice.actions.changeInterval
