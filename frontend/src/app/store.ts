import { configureStore } from "@reduxjs/toolkit"
import logger from 'redux-logger'
import securityReducer from "../features/securitySlice"
import formReducer from "../features/Form/formSlice"

const STORAGE_KEY = "stockWizard:symbols"

function loadSymbols(): string[] | undefined {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw === null) return undefined
        const parsed: unknown = JSON.parse(raw)
        if (!Array.isArray(parsed)) return undefined
        return parsed.filter((s): s is string => typeof s === "string")
    } catch {
        return undefined
    }
}

function saveSymbols(symbols: string[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols))
    } catch {
        // quota / disabled storage — ignore
    }
}

const persistedSymbols = loadSymbols()

const store = configureStore({

    reducer: {
        form: formReducer,
        security: securityReducer
    },

    preloadedState: persistedSymbols
        ? { security: { symbols: persistedSymbols, selectedSec: persistedSymbols[0] ?? '' } }
        : undefined,

    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger)

})

export type TRootState = ReturnType<typeof store.getState>
export type TAppDispatch = typeof store.dispatch

let lastSymbols = store.getState().security.symbols
store.subscribe(() => {
    const next = store.getState().security.symbols
    if (next !== lastSymbols) {
        lastSymbols = next
        saveSymbols(next)
    }
})

export default store
