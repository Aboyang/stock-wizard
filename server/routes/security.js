import { Router } from "express"
import { getChart, getSuggestions, getRecommendationsCtrl, getNews, getNewsInsights, getProfile, getFinancials } from "../controllers/securityController.js"

const router = Router()

router.get("/", getChart)
router.get("/suggestion", getSuggestions)
router.get("/recommendation", getRecommendationsCtrl)
router.get("/news", getNews)
router.get("/news/insights", getNewsInsights)
router.get("/profile", getProfile)
router.get("/financials", getFinancials)

export default router
