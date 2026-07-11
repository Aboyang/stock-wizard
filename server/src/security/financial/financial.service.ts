import YahooFinance from "yahoo-finance2"
import { getCache, setCache } from "../../shared/cache.service.js"

const yf = new YahooFinance()

// Yahoo sector name -> SPDR sector ETF (cap-weighted, used as sector P/E benchmark)
const SECTOR_ETF: Record<string, string> = {
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

export interface IYoYGrowth {
    revenueYoY: number | null
    grossProfitYoY: number | null
    freeCashFlowYoY: number | null
}

export interface IFinancialEvents {
    earningsDate: Date | string | null
    exDividendDate: Date | string | null
    dividendDate: Date | string | null
}

export interface IFinancials extends IYoYGrowth {
    revenue: number | null
    grossProfit: number | null
    freeCashFlow: number | null
    targetPrice: number | null
    eps: number | null
    peRatio: number | null
    sectorPE: number | null
    events: IFinancialEvents
}

// a fundamentals row keyed by metric name, plus its reporting date
type TFundamentalsRow = { date: Date | string } & Record<string, unknown>

// year-over-year growth for revenue / gross profit / free cash flow using
// fundamentalsTimeSeries (more reliable than the legacy *StatementHistory modules)
async function fetchAnnualYoY(symbol: string): Promise<IYoYGrowth> {
    try {
        const period1 = new Date()
        period1.setFullYear(period1.getFullYear() - 6)

        const fts = await yf.fundamentalsTimeSeries(
            symbol,
            { period1, type: "annual", module: "all" },
            { validateResult: false },
        ) as TFundamentalsRow[]

        console.log(`>>> [yoy] ${symbol} fts entries: ${fts.length}, sample keys: ${fts[0] ? Object.keys(fts[0]).slice(0, 10).join(",") : "(empty)"}`)

        const yoyFor = (key: string): number | null => {
            const entries = fts
                .filter(e => e[key] != null)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            if (entries.length < 2) return null
            const curr = entries[0][key] as number
            const prev = entries[1][key] as number
            if (prev == null || prev === 0) return null
            return (curr - prev) / prev
        }

        let grossProfitYoY = yoyFor("grossProfit")
        if (grossProfitYoY == null) {
            // fallback: totalRevenue - costOfRevenue
            const rows = fts
                .filter(e => e.totalRevenue != null && e.costOfRevenue != null)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            if (rows.length >= 2) {
                const currGP = (rows[0].totalRevenue as number) - (rows[0].costOfRevenue as number)
                const prevGP = (rows[1].totalRevenue as number) - (rows[1].costOfRevenue as number)
                if (prevGP !== 0) grossProfitYoY = (currGP - prevGP) / prevGP
            }
        }

        return {
            revenueYoY: yoyFor("totalRevenue"),
            grossProfitYoY,
            freeCashFlowYoY: yoyFor("freeCashFlow"),
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`>>> [yoy] failed for ${symbol}: ${message}`)
        return { revenueYoY: null, grossProfitYoY: null, freeCashFlowYoY: null }
    }
}

async function fetchSectorPE(sector: string | undefined): Promise<number | null> {
    const etf = sector ? SECTOR_ETF[sector] : undefined
    if (!etf) return null

    const cacheKey = `sectorPE:${etf}`
    const cached = await getCache<number | null>(cacheKey)
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
export async function fetchFinancials(symbol: string): Promise<IFinancials> {
    const cacheKey = `financials:${symbol}`

    const cached = await getCache<IFinancials>(cacheKey)
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

    const fd = response.financialData
    const ks = response.defaultKeyStatistics
    const sd = response.summaryDetail
    const ce = response.calendarEvents
    const ap = response.assetProfile

    const earningsDateRaw = ce?.earnings?.earningsDate
    const earningsDate = Array.isArray(earningsDateRaw) ? earningsDateRaw[0] : earningsDateRaw

    const [sectorPE, yoy] = await Promise.all([
        fetchSectorPE(ap?.sector),
        fetchAnnualYoY(symbol),
    ])

    const financials: IFinancials = {
        revenue: fd?.totalRevenue ?? null,
        grossProfit: fd?.grossProfits ?? null,
        freeCashFlow: fd?.freeCashflow ?? null,
        revenueYoY: yoy.revenueYoY,
        grossProfitYoY: yoy.grossProfitYoY,
        freeCashFlowYoY: yoy.freeCashFlowYoY,
        targetPrice: fd?.targetMeanPrice ?? null,
        eps: ks?.trailingEps ?? null,
        peRatio: sd?.trailingPE ?? ks?.forwardPE ?? null,
        sectorPE,
        events: {
            earningsDate: earningsDate ?? null,
            exDividendDate: ce?.exDividendDate ?? null,
            dividendDate: ce?.dividendDate ?? null,
        },
    }

    await setCache(cacheKey, financials, 30)
    return financials
}
