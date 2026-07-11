import { Router } from "express"
import { postRollingStats, postMovingAverage, postMeanReversion } from "./analytics.controller.js"

const router: Router = Router()

router.post("/rolling-stats", postRollingStats)
router.post("/moving-average", postMovingAverage)
router.post("/mean-reversion", postMeanReversion)

export default router
