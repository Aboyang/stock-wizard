import YahooFinance from "yahoo-finance2"
import { getCache, setCache } from "./cacheService.js"
import { summarizeNews } from "./claudeService.js"
import { extractArticleText } from "./articleService.js"

const yf = new YahooFinance()

// fetch chart data for a security; cache-first (5min TTL, bucketed by day)
export async function fetchChart(symbol, start, end, interval) {
    const startTime = Date.now()

    const cacheKey = `chart:${symbol}:${Math.floor(new Date(parseInt(start)).getTime() / 86400000)}:${Math.floor(new Date(parseInt(end)).getTime() / 86400000)}:${interval}`

    console.log(`>>> Cache key: ${cacheKey}`)

    const cached = await getCache(cacheKey)
    console.log(">>> Checking cache...")
    if (cached) {
        console.log(">>> Cache hit!")
        console.log(`Latency: ${Date.now() - startTime}ms`)
        return cached
    }

    console.log(">>> Cache miss!")
    console.log(">>> Fetching from Yahoo Finance...")

    const period1 = new Date(parseInt(start))
    const period2 = new Date(parseInt(end))

    const response = await yf.chart(symbol, { period1, period2, interval })

    console.log(`Latency: ${Date.now() - startTime}ms`)

    const quotes = response.quotes
    await setCache(cacheKey, quotes, 300)

    return quotes
}

export async function searchSuggestions(search) {
    const response = await yf.search(search)
    return response.quotes
        .filter(q => ["EQUITY", "ETF"].includes(q.quoteType))
        .map(q => q.symbol)
}

export async function getRecommendations(symbol) {
    const response = await yf.recommendationsBySymbol(symbol)
    return response.recommendedSymbols.map(s => s.symbol)
}

// Yahoo sector name -> SPDR sector ETF (cap-weighted, used as sector P/E benchmark)
const SECTOR_ETF = {
    "Technology": "XLK",
    "Healthcare": "XLV",
    "Financial Services": "XLF",
    "Consumer Cyclical": "XLY",
    "Communication Services": "XLC",
    "Industrials": "XLI",
    "Consumer Defensive": "XLP",
    "Energy": "XLE",
    "Basic Materials": "XLB",
    "Real Estate": "XLRE",
    "Utilities": "XLU",
}

// year-over-year growth for revenue / gross profit / free cash flow using
// fundamentalsTimeSeries (more reliable than the legacy *StatementHistory modules)
async function fetchAnnualYoY(symbol) {
    try {
        const period1 = new Date()
        period1.setFullYear(period1.getFullYear() - 6)

        const fts = await yf.fundamentalsTimeSeries(
            symbol,
            { period1, type: "annual", module: "all" },
            { validateResult: false },
        )

        console.log(`>>> [yoy] ${symbol} fts entries: ${fts.length}, sample keys: ${fts[0] ? Object.keys(fts[0]).slice(0, 10).join(",") : "(empty)"}`)

        const yoyFor = (key) => {
            const entries = fts
                .filter(e => e[key] != null)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
            if (entries.length < 2) return null
            const curr = entries[0][key]
            const prev = entries[1][key]
            if (prev == null || prev === 0) return null
            return (curr - prev) / prev
        }

        let grossProfitYoY = yoyFor("grossProfit")
        if (grossProfitYoY == null) {
            // fallback: totalRevenue - costOfRevenue
            const rows = fts
                .filter(e => e.totalRevenue != null && e.costOfRevenue != null)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
            if (rows.length >= 2) {
                const currGP = rows[0].totalRevenue - rows[0].costOfRevenue
                const prevGP = rows[1].totalRevenue - rows[1].costOfRevenue
                if (prevGP !== 0) grossProfitYoY = (currGP - prevGP) / prevGP
            }
        }

        return {
            revenueYoY: yoyFor("totalRevenue"),
            grossProfitYoY,
            freeCashFlowYoY: yoyFor("freeCashFlow"),
        }
    } catch (err) {
        console.error(`>>> [yoy] failed for ${symbol}: ${err.message}`)
        return { revenueYoY: null, grossProfitYoY: null, freeCashFlowYoY: null }
    }
}

async function fetchSectorPE(sector) {
    const etf = SECTOR_ETF[sector]
    if (!etf) return null

    const cacheKey = `sectorPE:${etf}`
    const cached = await getCache(cacheKey)
    if (cached !== null && cached !== undefined) return cached

    try {
        const r = await yf.quoteSummary(etf, { modules: ["summaryDetail"] })
        const pe = r.summaryDetail?.trailingPE ?? null
        await setCache(cacheKey, pe, 3600)
        return pe
    } catch {
        return null
    }
}

// fetch company financials + key stats + upcoming calendar events; cache-first (1h TTL)
export async function fetchFinancials(symbol) {
    const cacheKey = `financials:${symbol}`

    const cached = await getCache(cacheKey)
    if (cached) {
        console.log(`>>> [financials] cache hit for ${symbol}`)
        return cached
    }

    console.log(`>>> [financials] cache miss for ${symbol}, fetching from Yahoo`)
    const response = await yf.quoteSummary(symbol, {
        modules: [
            "financialData",
            "defaultKeyStatistics",
            "summaryDetail",
            "calendarEvents",
            "assetProfile",
        ],
    })

    const fd = response.financialData || {}
    const ks = response.defaultKeyStatistics || {}
    const sd = response.summaryDetail || {}
    const ce = response.calendarEvents || {}
    const ap = response.assetProfile || {}

    const earningsDateRaw = ce.earnings?.earningsDate
    const earningsDate = Array.isArray(earningsDateRaw) ? earningsDateRaw[0] : earningsDateRaw

    const [sectorPE, yoy] = await Promise.all([
        fetchSectorPE(ap.sector),
        fetchAnnualYoY(symbol),
    ])

    const financials = {
        revenue: fd.totalRevenue ?? null,
        grossProfit: fd.grossProfits ?? null,
        freeCashFlow: fd.freeCashflow ?? null,
        revenueYoY: yoy.revenueYoY,
        grossProfitYoY: yoy.grossProfitYoY,
        freeCashFlowYoY: yoy.freeCashFlowYoY,
        targetPrice: fd.targetMeanPrice ?? null,
        eps: ks.trailingEps ?? null,
        peRatio: sd.trailingPE ?? ks.forwardPE ?? null,
        sectorPE,
        events: {
            earningsDate: earningsDate ?? null,
            exDividendDate: ce.exDividendDate ?? null,
            dividendDate: ce.dividendDate ?? null,
        },
    }

    await setCache(cacheKey, financials, 30)
    return financials
}

// fetch company profile (sector, industry, country, business summary); cache-first (1h TTL)
export async function fetchProfile(symbol) {
    const cacheKey = `profile:${symbol}`

    const cached = await getCache(cacheKey)
    if (cached) {
        console.log(`>>> [profile] cache hit for ${symbol}`)
        return cached
    }

    console.log(`>>> [profile] cache miss for ${symbol}, fetching from Yahoo`)
    const response = await yf.quoteSummary(symbol, { modules: ["assetProfile"] })
    const p = response.assetProfile || {}

    const profile = {
        sector: p.sector || null,
        industry: p.industry || null,
        country: p.country || null,
        summary: p.longBusinessSummary || null,
        website: p.website || null,
        employees: p.fullTimeEmployees || null,
    }

    await setCache(cacheKey, profile, 3600)
    return profile
}

// fetch top news headlines for a security; cache-first (15min TTL)
export async function fetchNews(symbol, count = 3) {
    const cacheKey = `news:${symbol}:${count}`
    console.log(`>>> [news] fetching for ${symbol} (cacheKey=${cacheKey})`)

    const cached = await getCache(cacheKey)
    if (cached) {
        console.log(`>>> [news] cache hit (${cached.length} items)`)
        return cached
    }

    console.log(`>>> [news] cache miss, calling Yahoo`)
    const response = await yf.search(symbol, { newsCount: count, quotesCount: 0 })

    const news = (response.news || []).slice(0, count).map(n => ({
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
export async function fetchInsights(symbol, count = 3) {
    const cacheKey = `insights:${symbol}:${count}`
    console.log(`>>> [insights] fetching for ${symbol} (cacheKey=${cacheKey})`)

    const cached = await getCache(cacheKey)
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

    const newsWithBodies = news.map((n, i) => ({ ...n, body: bodies[i] }))

    console.log(`>>> [insights] calling Claude`)
    const t1 = Date.now()
    const insights = await summarizeNews(newsWithBodies, symbol)
    console.log(`>>> [insights] Claude done in ${Date.now() - t1}ms`)

    const result = news.map((n, i) => ({ uuid: n.uuid, ...insights[i] }))

    await setCache(cacheKey, result, 3600)
    return result
}
