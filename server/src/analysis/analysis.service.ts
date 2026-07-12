import Anthropic from "@anthropic-ai/sdk"
import { ANALYSIS_SYSTEM_PROMPT, buildAnalysisUserPrompt } from "./analysis.prompt.js"
import type { IAnalysisRequest } from "./analysis.prompt.js"

const apiKey = process.env.ANTHROPIC_API_KEY
const client: Anthropic | null = apiKey ? new Anthropic({ apiKey }) : null

if (!client) {
    console.warn(">>>API KEY not set — stock analysis stream will be skipped")
}

export async function* streamStockAnalysis(request: IAnalysisRequest): AsyncGenerator<string, void, undefined> {
    if (!client) {
        yield "Anthropic API key is not configured on the server. Set ANTHROPIC_API_KEY in server/.env to enable AI analysis."
        return
    }

    const stream = await client.messages.stream({
        model: "claude-haiku-4-5",
        max_tokens: 3000,
        system: ANALYSIS_SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildAnalysisUserPrompt(request) }],
    })

    for await (const event of stream) {
        if (
            event.type === "content_block_delta" &&
            event.delta?.type === "text_delta"
        ) {
            yield event.delta.text
        }
    }
}
