import { createSlice } from "@reduxjs/toolkit"

const initialState = {

    start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 * 6).toISOString(),
    end: new Date(Date.now()).toISOString(),
    timeframe: '6m',
    interval: '1d'

}

const formSlice = createSlice({

    name: "form",
    initialState,

    reducers: {

        changeTimeframe: (state, action) => {

            state.timeframe = action.payload

            let n = 1
            switch (state.timeframe) {
                case "1m": 
                    n = 1
                    break
                case "3m": 
                    n = 3
                    break
                case "6m": 
                    n = 6
                    break
                case "1y": 
                    n = 12
                    break
                case "2y":
                    n = 24
                    break
            }

            state.start = new Date(Date.now() - 2592000000 * n).toISOString()
        }
    }
})

export default formSlice.reducer
export const changeTimeframe = formSlice.actions.changeTimeframe
