import type { Request, Response } from "express"
import { streamAdvisorRecommendation } from "./advisor.service.js"
import type { IAdvisorPrefs } from "./advisor.prompt.js"

export async function postAdvisorStream(req: Request<unknown, unknown, IAdvisorPrefs>, res: Response): Promise<void> {
    const prefs: IAdvisorPrefs = req.body || {}

    res.setHeader("Content-Type", "text/plain; charset=utf-8")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("X-Accel-Buffering", "no")
    res.flushHeaders?.()

    try {
        for await (const chunk of streamAdvisorRecommendation(prefs)) {
            res.write(chunk)
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(">>> advisor stream failed:", message)
        res.write(`\n\n_Error generating recommendation: ${message}_`)
    } finally {
        res.end()
    }
}
