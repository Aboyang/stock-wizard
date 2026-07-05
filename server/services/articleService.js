import axios from "axios"
import { JSDOM } from "jsdom"
import { Readability } from "@mozilla/readability"

const FETCH_TIMEOUT_MS = 5000
const MAX_CHARS = 4000

// fetch a news URL and extract the readable article body
export async function extractArticleText(url) {
    if (!url) return ""

    try {
        const res = await axios.get(url, {
            timeout: FETCH_TIMEOUT_MS,
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Accept: "text/html",
            },
            maxRedirects: 5,
            responseType: "text",
            validateStatus: s => s >= 200 && s < 400,
            insecureHTTPParser: true,
        })

        const dom = new JSDOM(res.data, { url })
        const reader = new Readability(dom.window.document)
        const article = reader.parse()

        const text = (article?.textContent || "").replace(/\s+/g, " ").trim()
        return text.slice(0, MAX_CHARS)
    } catch (err) {
        console.warn(`>>> Article extraction failed for ${url}: ${err.message}`)
        return ""
    }
}
