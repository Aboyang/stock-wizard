import Anthropic from "@anthropic-ai/sdk"

const apiKey = process.env.ANTHROPIC_API_KEY
const client = apiKey ? new Anthropic({ apiKey }) : null

if (!client) {
    console.warn(">>>API KEY not set — news summaries will be skipped")
}

const INSIGHT_SCHEMA = {
    type: "object",
    properties: {
        items: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    summary: { type: "string" },
                    insight: { type: "string" },
                    recommendation: { type: "string" },
                },
                required: ["summary", "insight", "recommendation"],
                additionalProperties: false,
            },
        },
    },
    required: ["items"],
    additionalProperties: false,
}

export async function summarizeNews(articles, symbol) {
    if (!client || articles.length === 0) return articles.map(() => ({}))

    const prompt = `You are a financial analyst writing for retail investors. For each article about ${symbol}, produce three fields based on the article body when provided (fall back to the headline if the body is empty):
- summary: 1-2 neutral sentences providing context about what the article reports.
- insight: 1-2 sentences explaining what this could mean for a retail investor holding or considering ${symbol}.
- recommendation: a single concise line (e.g. "Hold and monitor earnings", "Consider trimming exposure").

Articles:
${articles.map((a, i) => `--- Article ${i + 1} ---
Headline: "${a.title}"
Publisher: ${a.publisher}
Body: ${a.body ? a.body : "(unavailable — use the headline only)"}`).join("\n\n")}

Return one entry per article, in the same order.`

    try {
        const response = await client.messages.create({
            model: "claude-haiku-4-5",
            max_tokens: 4096,
            output_config: { format: { type: "json_schema", schema: INSIGHT_SCHEMA } },
            messages: [{ role: "user", content: prompt }],
        })

        const textBlock = response.content.find(b => b.type === "text")
        const parsed = textBlock ? JSON.parse(textBlock.text) : {}
        const items = Array.isArray(parsed.items) ? parsed.items : []
        return articles.map((_, i) => items[i] || {})
    } catch (err) {
        console.error(">>> Claude summarization failed:", err.message)
        return articles.map(() => ({}))
    }
}
