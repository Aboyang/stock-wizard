import { Router } from "express"
import { postRollingStats, postMovingAverage, postMeanReversion } from "../controllers/analyticsController.js"

const router = Router()

router.post("/rolling-stats", postRollingStats)
router.post("/moving-average", postMovingAverage)
router.post("/mean-reversion", postMeanReversion)

export default router
