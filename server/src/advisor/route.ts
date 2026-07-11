import { Router } from "express"
import { postAdvisorStream } from "./advisor.controller.js"

const router: Router = Router()

router.post("/stream", postAdvisorStream)

export default router
