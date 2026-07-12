import type { Request, Response } from "express"
import { streamStockAnalysis } from "./analysis.service.js"
import type { IAnalysisRequest } from "./analysis.prompt.js"

export async function postAnalysisStream(req: Request<unknown, unknown, Partial<IAnalysisRequest>>, res: Response): Promise<void> {
    const { symbol, question, timeframe, interval, snapshot } = req.body ?? {}

    if (typeof symbol !== "string" || symbol === "" || typeof question !== "string" || question === "") {
        res.status(400).send("Invalid input: symbol and question are required")
        return
    }

    const request: IAnalysisRequest = {
        symbol,
        question,
        timeframe,
        interval,
        snapshot: snapshot ?? {},
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("X-Accel-Buffering", "no")
    res.flushHeaders?.()

    try {
        for await (const chunk of streamStockAnalysis(request)) {
            res.write(chunk)
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(">>> analysis stream failed:", message)
        res.write(`\n\n_Error generating analysis: ${message}_`)
    } finally {
        res.end()
    }
}
