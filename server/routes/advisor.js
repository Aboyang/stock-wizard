import { Router } from "express"
import { postAdvisorStream } from "../controllers/advisorController.js"

const router = Router()

router.post("/stream", postAdvisorStream)

export default router
