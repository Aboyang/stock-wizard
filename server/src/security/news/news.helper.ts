import axios from "axios"
import { JSDOM } from "jsdom"
import { Readability } from "@mozilla/readability"
import Anthropic from "@anthropic-ai/sdk"

export interface INewsArticle {
    uuid: string
    title: string
    publisher: string
    link: string
    providerPublishTime: Date | string
    thumbnail: string | null
    body?: string
}

export interface IArticleInsight {
    summary: string
    insight: string
    recommendation: string
}

const FETCH_TIMEOUT_MS = 5000
const MAX_CHARS = 4000

// fetch a news URL and extract the readable article body
export async function extractArticleText(url: string): Promise<string> {
    if (!url) return ""

    try {
        const res = await axios.get<string>(url, {
            timeout: FETCH_TIMEOUT_MS,
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Accept: "text/html",
            },
            maxRedirects: 5,
            responseType: "text",
            validateStatus: (s: number) => s >= 200 && s < 400,
            insecureHTTPParser: true,
        })

        const dom = new JSDOM(res.data, { url })
        const reader = new Readability(dom.window.document)
        const article = reader.parse()

        const text = (article?.textContent || "").replace(/\s+/g, " ").trim()
        return text.slice(0, MAX_CHARS)
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.warn(`>>> Article extraction failed for ${url}: ${message}`)
        return ""
    }
}

const apiKey = process.env.ANTHROPIC_API_KEY
const client: Anthropic | null = apiKey ? new Anthropic({ apiKey }) : null

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
} as const

export async function summarizeNews(articles: INewsArticle[], symbol: string): Promise<Partial<IArticleInsight>[]> {
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
        const parsed: { items?: IArticleInsight[] } = textBlock ? JSON.parse(textBlock.text) : {}
        const items = Array.isArray(parsed.items) ? parsed.items : []
        return articles.map((_, i) => items[i] || {})
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(">>> Claude summarization failed:", message)
        return articles.map(() => ({}))
    }
}
