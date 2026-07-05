import { streamAdvisorRecommendation } from "../services/advisorService.js"

export async function postAdvisorStream(req, res) {
    const prefs = req.body || {}

    res.setHeader("Content-Type", "text/plain; charset=utf-8")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("X-Accel-Buffering", "no")
    res.flushHeaders?.()

    try {
        for await (const chunk of streamAdvisorRecommendation(prefs)) {
            res.write(chunk)
        }
    } catch (err) {
        console.error(">>> advisor stream failed:", err.message)
        res.write(`\n\n_Error generating recommendation: ${err.message}_`)
    } finally {
        res.end()
    }
}
