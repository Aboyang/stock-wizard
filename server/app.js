import express from "express"
import cors from "cors"
import securityRouter from "./routes/security.js"
import analyticsRouter from "./routes/analytics.js"

const app = express()

// middleware
app.use(cors())
app.use(express.json())

// mount router
app.use("/api/security", securityRouter)
app.use("/api/analytics", analyticsRouter)


app.listen(5001, () => {
    console.log("Server listening on port 5001")
})
