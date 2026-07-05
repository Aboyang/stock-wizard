import Anthropic from "@anthropic-ai/sdk"

const apiKey = process.env.ANTHROPIC_API_KEY
const client = apiKey ? new Anthropic({ apiKey }) : null

if (!client) {
    console.warn(">>>API KEY not set — advisor stream will be skipped")
}

const SYSTEM_PROMPT = `You are a portfolio advisor for retail investors. Given a user's risk appetite, return goal, time horizon, and thematic interests, produce a concise, opinionated allocation across 5-10 publicly listed equities or ETFs.

Output format (markdown):
1. A short opening paragraph (2-3 sentences) summarising the strategy and how it ties to the user's settings.
2. A markdown table with columns: Ticker | Allocation % | Rationale. Use real, currently-listed US tickers. Allocations must sum to 100.
3. A short closing paragraph (1-2 sentences) noting one key risk to monitor.

After your markdown is complete, emit the sentinel \`---TICKERS---\` on its own line, followed immediately by a single JSON object: {"tickers":[{"symbol":"AAPL","allocation":20}, ...]}. The JSON must be valid and the allocations must match the table.

Do not wrap your response in code fences. Do not say anything after the JSON.`

export async function* streamAdvisorRecommendation(prefs) {
    if (!client) {
        yield "Anthropic API key is not configured on the server. Set ANTHROPIC_API_KEY in server/.env to enable AI recommendations."
        return
    }

    const userPrompt = `My investing preferences:
- Risk appetite: ${prefs.riskAppetite}/10
- Annual return goal: ${prefs.returnGoal}%
- Time horizon: ${prefs.timeHorizon} year(s)
- Themes of interest: ${prefs.themes?.length ? prefs.themes.join(", ") : "no specific theme"}

Build me an allocation that fits this profile.`

    const stream = await client.messages.stream({
        model: "claude-haiku-4-5",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
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
