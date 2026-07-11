import "dotenv/config"
import express from "express"
import cors from "cors"
import securityRouter from "./security/route.js"
import analyticsRouter from "./analytics/route.js"
import advisorRouter from "./advisor/route.js"

const app = express()

// middleware
app.use(cors())
app.use(express.json())

// mount router
app.use("/api/security", securityRouter)
app.use("/api/analytics", analyticsRouter)
app.use("/api/advisor", advisorRouter)


const PORT = process.env.PORT ?? 5001
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})
