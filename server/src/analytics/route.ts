import { Router } from "express"
import { postRollingStats, postMovingAverage, postRSI, postKDJ, postMeanReversion } from "./analytics.controller.js"

const router: Router = Router()

router.post("/rolling-stats", postRollingStats)
router.post("/moving-average", postMovingAverage)
router.post("/rsi", postRSI)
router.post("/kdj", postKDJ)
router.post("/mean-reversion", postMeanReversion)

export default router
