import { useSelector } from "react-redux"

import "./CarouselView.css"
import CardView from "../Card/CardView"

function CarouselView() {

    const symbols = useSelector((state) => state.security.symbols)

    return (
        <div className="carousel">
            {[...symbols].reverse().map((symbol, index) => (
                <CardView key={index} symbol={symbol} index={symbols.length - 1 - index}/> // key prop cannot be accessed in child component
            ))}
        </div>
    )
}

export default CarouselView
