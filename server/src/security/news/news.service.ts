import YahooFinance from "yahoo-finance2"
import { getCache, setCache } from "../../shared/cache.service.js"
import { summarizeNews, extractArticleText } from "./news.helper.js"
import type { INewsArticle, IArticleInsight } from "./news.helper.js"

const yf = new YahooFinance()

export type TNewsInsight = { uuid: string } & Partial<IArticleInsight>

// fetch top news headlines for a security; cache-first (15min TTL)
export async function fetchNews(symbol: string, count: number = 3): Promise<INewsArticle[]> {
    const cacheKey = `news:${symbol}:${count}`
    console.log(`>>> [news] fetching for ${symbol} (cacheKey=${cacheKey})`)

    const cached = await getCache<INewsArticle[]>(cacheKey)
    if (cached) {
        console.log(`>>> [news] cache hit (${cached.length} items)`)
        return cached
    }

    console.log(`>>> [news] cache miss, calling Yahoo`)
    const response = await yf.search(symbol, { newsCount: count, quotesCount: 0 })

    const news: INewsArticle[] = (response.news || []).slice(0, count).map(n => ({
        uuid: n.uuid,
        title: n.title,
        publisher: n.publisher,
        link: n.link,
        providerPublishTime: n.providerPublishTime,
        thumbnail: n.thumbnail?.resolutions?.[0]?.url || null,
    }))

    await setCache(cacheKey, news, 900)
    return news
}

// fetch AI summary/insight/recommendation per article; cache-first (15min TTL)
export async function fetchInsights(symbol: string, count: number = 3): Promise<TNewsInsight[]> {
    const cacheKey = `insights:${symbol}:${count}`
    console.log(`>>> [insights] fetching for ${symbol} (cacheKey=${cacheKey})`)

    const cached = await getCache<TNewsInsight[]>(cacheKey)
    if (cached) {
        console.log(`>>> [insights] cache hit`)
        return cached
    }

    const news = await fetchNews(symbol, count)
    if (news.length === 0) return []

    console.log(`>>> [insights] scraping ${news.length} article bodies`)
    const t0 = Date.now()
    const bodies = await Promise.all(news.map(n => extractArticleText(n.link)))
    console.log(`>>> [insights] scraping done in ${Date.now() - t0}ms (lengths: ${bodies.map(b => b.length).join(",")})`)

    const newsWithBodies: INewsArticle[] = news.map((n, i) => ({ ...n, body: bodies[i] }))

    console.log(`>>> [insights] calling Claude`)
    const t1 = Date.now()
    const insights = await summarizeNews(newsWithBodies, symbol)
    console.log(`>>> [insights] Claude done in ${Date.now() - t1}ms`)

    const result: TNewsInsight[] = news.map((n, i) => ({ uuid: n.uuid, ...insights[i] }))

    await setCache(cacheKey, result, 3600)
    return result
}
