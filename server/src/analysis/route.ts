import { Router } from "express"
import { postAnalysisStream } from "./analysis.controller.js"

const router: Router = Router()

router.post("/stream", postAnalysisStream)

export default router
