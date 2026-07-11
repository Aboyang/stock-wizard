import { useEffect, useState } from "react"
import { useAppSelector } from "../../app/hooks"

import "./CarouselView.css"
import CardView from "../Card/CardView"

function CarouselView() {

    const symbols = useAppSelector((state) => state.security.symbols)
    const [isEditMode, setIsEditMode] = useState(false)

    useEffect(() => {
        if (!isEditMode) return
        function onDocPointerDown(e: PointerEvent) {
            if (!(e.target instanceof Element) || !e.target.closest(".card")) setIsEditMode(false)
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
