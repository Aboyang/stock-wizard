import { Provider } from "react-redux"
import store from "./app/store"

import FormView from "./features/Form/FormView"
import CarouselView from "./features/Carousel/CarouselView"
import ChartView from "./features/Chart/ChartView"

import "./App.css"

function App() {
  return (
    <Provider store={store}>
      <div className="app">
        <div className="form-and-cards">
          <FormView />
          <CarouselView />
        </div>
        <ChartView />
      </div>
    </Provider>
  )
}

export default App
