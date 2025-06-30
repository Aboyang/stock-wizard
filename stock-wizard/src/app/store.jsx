import { configureStore } from "@reduxjs/toolkit"
import logger from 'redux-logger'
import securityReducer from "../features/securitySlice"
import formReducer from "../features/Form/formSlice"


const store = configureStore({

    reducer: {
        form: formReducer,
        security: securityReducer
    },

    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger)

})

export default store
