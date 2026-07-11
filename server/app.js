import "dotenv/config"
import express from "express"
import cors from "cors"
import securityRouter from "./routes/security.js"
import analyticsRouter from "./routes/analytics.js"
import advisorRouter from "./routes/advisor.js"

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
