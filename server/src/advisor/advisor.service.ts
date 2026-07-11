import Anthropic from "@anthropic-ai/sdk"
import { ADVISOR_SYSTEM_PROMPT, buildAdvisorUserPrompt } from "./advisor.prompt.js"
import type { IAdvisorPrefs } from "./advisor.prompt.js"

const apiKey = process.env.ANTHROPIC_API_KEY
const client: Anthropic | null = apiKey ? new Anthropic({ apiKey }) : null

if (!client) {
    console.warn(">>>API KEY not set — advisor stream will be skipped")
}

export async function* streamAdvisorRecommendation(prefs: IAdvisorPrefs): AsyncGenerator<string, void, undefined> {
    if (!client) {
        yield "Anthropic API key is not configured on the server. Set ANTHROPIC_API_KEY in server/.env to enable AI recommendations."
        return
    }

    const stream = await client.messages.stream({
        model: "claude-haiku-4-5",
        max_tokens: 2048,
        system: ADVISOR_SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildAdvisorUserPrompt(prefs) }],
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
