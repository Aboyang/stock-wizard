import { configureStore } from "@reduxjs/toolkit"
import logger from 'redux-logger'
import securityReducer from "../features/securitySlice"
import formReducer from "../features/Form/formSlice"

const STORAGE_KEY = "stockWizard:symbols"

function loadSymbols() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw === null) return undefined
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return undefined
        return parsed.filter((s) => typeof s === "string")
    } catch {
        return undefined
    }
}

function saveSymbols(symbols) {
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
        ? { security: { symbols: persistedSymbols, selectedSec: '' } }
        : undefined,

    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger)

})

let lastSymbols = store.getState().security.symbols
store.subscribe(() => {
    const next = store.getState().security.symbols
    if (next !== lastSymbols) {
        lastSymbols = next
        saveSymbols(next)
    }
})

export default store