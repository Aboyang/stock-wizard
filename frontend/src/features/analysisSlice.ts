import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { IPricePoint } from "./Card/query"
import type { ICardMetrics } from "./Card/metrics"
import type {
    IRollingStatsResult,
    IMovingAverageResult,
    IRSIResult,
    IKDJResult,
    IMeanReversionResult,
    ISecurityProfile,
    IFinancials,
    INewsArticle,
    INewsInsight,
} from "./Chart/query"

// everything the app knows about one security, mirrored from the query cache
export interface ISecuritySnapshot {
    prices?: IPricePoint[]
    metrics?: ICardMetrics
    profile?: ISecurityProfile
    financials?: IFinancials
    news?: INewsArticle[]
    newsInsights?: INewsInsight[]
    rollingStats?: IRollingStatsResult
    movingAverage?: IMovingAverageResult
    rsi?: IRSIResult
    kdj?: IKDJResult
    meanReversion?: IMeanReversionResult
}

export interface IAnalysisState {
    snapshots: Record<string, ISecuritySnapshot>
}

const initialState: IAnalysisState = {
    snapshots: {},
}

const analysisSlice = createSlice({

    name: "analysis",
    initialState,

    reducers: {

        mergeSnapshot: (state, action: PayloadAction<{ symbol: string; data: Partial<ISecuritySnapshot> }>) => {
            const { symbol, data } = action.payload
            state.snapshots[symbol] = { ...state.snapshots[symbol], ...data }
        },
    },
})

export default analysisSlice.reducer
export const mergeSnapshot = analysisSlice.actions.mergeSnapshot
