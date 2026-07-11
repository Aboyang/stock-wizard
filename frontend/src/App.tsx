import { Provider } from "react-redux"
import { QueryClientProvider } from "@tanstack/react-query"
import store from "./app/store"
import { queryClient } from "./app/queryClient"

import FormView from "./features/Form/FormView"
import CarouselView from "./features/Carousel/CarouselView"
import ChartView from "./features/Chart/ChartView"
import SettingsView from "./features/Settings/SettingsView"

import "./App.css"

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <div className="app">
          <div className="form-and-cards">
            <FormView />
            <CarouselView />
          </div>
          <ChartView />
        </div>
        <SettingsView />
      </QueryClientProvider>
    </Provider>
  )
}

export default App
