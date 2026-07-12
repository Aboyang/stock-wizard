import "dotenv/config"
import express from "express"
import cors from "cors"
import securityRouter from "./security/route.js"
import analyticsRouter from "./analytics/route.js"
import advisorRouter from "./advisor/route.js"
import analysisRouter from "./analysis/route.js"

const app = express()

// middleware
// the analysis snapshot carries several full price series — the 100kb default is too small
app.use(cors())
app.use(express.json({ limit: "5mb" }))

// mount router
app.use("/api/security", securityRouter)
app.use("/api/analytics", analyticsRouter)
app.use("/api/advisor", advisorRouter)
app.use("/api/analysis", analysisRouter)


const PORT = process.env.PORT ?? 5001
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})
