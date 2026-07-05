import { useSelector } from "react-redux"
import { useEffect, useState } from "react"

import "./CarouselView.css"
import CardView from "../Card/CardView"

function CarouselView() {

    const symbols = useSelector((state) => state.security.symbols)
    const [isEditMode, setIsEditMode] = useState(false)

    useEffect(() => {
        if (!isEditMode) return
        function onDocPointerDown(e) {
            if (!e.target.closest(".card")) setIsEditMode(false)
        }
        document.addEventListener("pointerdown", onDocPointerDown)
        return () => document.removeEventListener("pointerdown", onDocPointerDown)
    }, [isEditMode])

    return (
        <div className="carousel">
            {[...symbols].reverse().map((symbol, index) => (
                <CardView
                    key={index}
                    symbol={symbol}
                    index={symbols.length - 1 - index}
                    isEditMode={isEditMode}
                    enterEditMode={() => setIsEditMode(true)}
                />
            ))}
        </div>
    )
}

export default CarouselView