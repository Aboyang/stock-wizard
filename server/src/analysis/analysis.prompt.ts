import type { IDataPoint } from "../analytics/analytics.helper.js"
import type { IRollingStatsResult } from "../analytics/rolling-stats/rolling-stats.helper.js"
import type { IMovingAverageResult } from "../analytics/moving-average/moving-average.helper.js"
import type { IRSIResult } from "../analytics/rsi/rsi.helper.js"
import type { IKDJResult } from "../analytics/kdj/kdj.helper.js"
import type { IMeanReversionResult, TSignalAction } from "../analytics/mean-reversion/mean-reversion.helper.js"
import type { ISecurityProfile } from "../security/profile/profile.service.js"
import type { IFinancials } from "../security/financial/financial.service.js"
import type { INewsArticle } from "../security/news/news.helper.js"
import type { TNewsInsight } from "../security/news/news.service.js"

// annualised metrics computed client-side on the watchlist cards
export interface ISnapshotMetrics {
    annualReturn: number
    annualVolatility: number
    sharpe: number
}

// the frontend's Redux analysis snapshot for one security; every field is
// optional — the prompt simply skips sections that are missing
export interface IStockSnapshot {
    prices?: IDataPoint[]
    metrics?: ISnapshotMetrics
    profile?: ISecurityProfile
    financials?: IFinancials
    news?: INewsArticle[]
    newsInsights?: TNewsInsight[]
    rollingStats?: IRollingStatsResult
    movingAverage?: IMovingAverageResult
    rsi?: IRSIResult
    kdj?: IKDJResult
    meanReversion?: IMeanReversionResult
}

export interface IAnalysisRequest {
    symbol: string
    question: string
    timeframe?: string
    interval?: string
    snapshot: IStockSnapshot
}

export const ANALYSIS_SYSTEM_PROMPT = `You are the stock-analysis assistant inside Stock Wizard, a retail investing dashboard. The user has selected one stock; you receive a data snapshot for it: company profile, financials, price history, annualised performance metrics, technical indicators (rolling return/volatility, moving averages, RSI, KDJ, pair-trading mean reversion), and recent news with AI-generated insights.

Rules:
- Ground every claim in the snapshot. Never invent numbers. If a data section is missing, note it in one short clause and move on.
- Respond in markdown, no code fences, under ~400 words.
- Structure: **Overview** (2-3 sentences), **Fundamentals**, **Technicals**, **News & Sentiment**, **Risks**, and finally **Bottom line** — where you directly answer the user's question in plain language.
- Be concrete and opinionated, but end with one italic line noting this is educational analysis, not financial advice.`

const N_PRICE_TAIL = 30
const N_CROSSOVERS = 3
const N_PAIR_SIGNALS = 3

const SIGNAL_ACTION_LABEL: Record<TSignalAction, string> = {
    "E": "exit",
    "S-L": "short target / long pair",
    "L-S": "long target / short pair",
}

function fmtDate(date: Date | string): string {
    const d = new Date(date)
    return isNaN(d.getTime()) ? String(date) : d.toISOString().slice(0, 10)
}

function fmtNum(n: number | null | undefined, digits = 2): string {
    return typeof n === "number" && isFinite(n) ? n.toFixed(digits) : "n/a"
}

function fmtPct(n: number | null | undefined): string {
    return typeof n === "number" && isFinite(n) ? `${(n * 100).toFixed(2)}%` : "n/a"
}

function fmtBig(n: number | null | undefined): string {
    if (typeof n !== "number" || !isFinite(n)) return "n/a"
    const abs = Math.abs(n)
    if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}T`
    if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`
    if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`
    return n.toFixed(0)
}

function priceSection(prices: IDataPoint[], timeframe?: string, interval?: string): string {
    const closes = prices.map(p => p.price)
    const first = closes[0]
    const latest = closes[closes.length - 1]
    const high = Math.max(...closes)
    const low = Math.min(...closes)
    const periodReturn = first !== 0 ? latest / first - 1 : null
    const tail = prices
        .slice(-N_PRICE_TAIL)
        .map(p => `${fmtDate(p.date)}: ${fmtNum(p.price)}`)
        .join(", ")

    return `## Price history (${timeframe ?? "selected range"}, ${interval ?? "?"} interval)
- ${prices.length} closes from ${fmtDate(prices[0].date)} to ${fmtDate(prices[prices.length - 1].date)}
- First ${fmtNum(first)}, latest ${fmtNum(latest)} (period return ${fmtPct(periodReturn)}), high ${fmtNum(high)}, low ${fmtNum(low)}
- Last ${Math.min(N_PRICE_TAIL, prices.length)} closes: ${tail}`
}

function metricsSection(metrics: ISnapshotMetrics): string {
    return `## Performance metrics (annualised, 4% risk-free)
- Return: ${fmtPct(metrics.annualReturn)}, volatility: ${fmtPct(metrics.annualVolatility)}, Sharpe: ${fmtNum(metrics.sharpe)}`
}

function profileSection(profile: ISecurityProfile): string {
    const summary = profile.summary
        ? (profile.summary.length > 600 ? `${profile.summary.slice(0, 600)}...` : profile.summary)
        : "n/a"
    return `## Company profile
- Sector: ${profile.sector ?? "n/a"}, industry: ${profile.industry ?? "n/a"}, country: ${profile.country ?? "n/a"}, employees: ${profile.employees ?? "n/a"}
- About: ${summary}`
}

function financialsSection(fin: IFinancials): string {
    const events: string[] = []
    if (fin.events?.earningsDate) events.push(`earnings ${fmtDate(fin.events.earningsDate)}`)
    if (fin.events?.exDividendDate) events.push(`ex-dividend ${fmtDate(fin.events.exDividendDate)}`)
    if (fin.events?.dividendDate) events.push(`dividend pay ${fmtDate(fin.events.dividendDate)}`)

    return `## Financials
- Revenue: ${fmtBig(fin.revenue)} (YoY ${fmtPct(fin.revenueYoY)}), gross profit: ${fmtBig(fin.grossProfit)} (YoY ${fmtPct(fin.grossProfitYoY)}), free cash flow: ${fmtBig(fin.freeCashFlow)} (YoY ${fmtPct(fin.freeCashFlowYoY)})
- EPS (TTM): ${fmtNum(fin.eps)}, P/E: ${fmtNum(fin.peRatio)} vs sector P/E ${fmtNum(fin.sectorPE)}, analyst target price: ${fmtNum(fin.targetPrice)}
- Upcoming events: ${events.length ? events.join(", ") : "none listed"}`
}

function technicalsSection(snapshot: IStockSnapshot): string {
    const lines: string[] = []
    const { rollingStats, movingAverage, rsi, kdj, meanReversion } = snapshot

    if (rollingStats) {
        lines.push(`- Rolling stats: momentum score ${fmtNum(rollingStats.momentumScore, 0)}/100, risk score ${fmtNum(rollingStats.riskScore, 0)}/100 (percentile ranks)`)
    }

    if (movingAverage) {
        const lastFast = movingAverage.fastMA[movingAverage.fastMA.length - 1]
        const lastSlow = movingAverage.slowMA[movingAverage.slowMA.length - 1]
        const crossovers = movingAverage.crossover
            .slice(-N_CROSSOVERS)
            .map(c => `${fmtDate(c.date)} ${c.signal} @ ${fmtNum(c.price)}`)
            .join("; ")
        lines.push(`- Moving averages: latest fast MA ${fmtNum(lastFast?.price)}, slow MA ${fmtNum(lastSlow?.price)}; recent crossovers: ${crossovers || "none in range"}`)
    }

    if (rsi) {
        lines.push(`- RSI: ${fmtNum(rsi.latestRSI)} → ${rsi.signal}`)
    }

    if (kdj) {
        lines.push(`- KDJ: K ${fmtNum(kdj.latestK)}, D ${fmtNum(kdj.latestD)}, J ${fmtNum(kdj.latestJ)} → ${kdj.signal}`)
    }

    if (meanReversion) {
        const { bestCorrelated, normal, signals } = meanReversion
        const recent = signals
            .slice(-N_PAIR_SIGNALS)
            .map(s => `${fmtDate(s.date)} ${SIGNAL_ACTION_LABEL[s.action] ?? s.action} (spread ${fmtNum(s.priceSpread)})`)
            .join("; ")
        lines.push(`- Pair trading (mean reversion): best correlated with ${bestCorrelated.symbol} (correlation ${fmtNum(bestCorrelated.correlation)}); price spread mean ${fmtNum(normal.meanPriceSpread)} ± ${fmtNum(normal.sdPriceSpread)}; recent signals: ${recent || "none in range"}`)
    }

    return lines.length ? `## Technical indicators\n${lines.join("\n")}` : ""
}

function newsSection(news: INewsArticle[], insights: TNewsInsight[] | undefined): string {
    const byUuid = new Map((insights ?? []).map(i => [i.uuid, i]))
    const items = news.map(article => {
        const insight = byUuid.get(article.uuid)
        const parts = [`- "${article.title}" — ${article.publisher}, ${fmtDate(article.providerPublishTime)}`]
        if (insight?.summary) parts.push(`  - Summary: ${insight.summary}`)
        if (insight?.insight) parts.push(`  - Insight: ${insight.insight}`)
        if (insight?.recommendation) parts.push(`  - Recommendation: ${insight.recommendation}`)
        return parts.join("\n")
    })
    return `## Recent news\n${items.join("\n")}`
}

export function buildAnalysisUserPrompt(req: IAnalysisRequest): string {
    const { symbol, question, timeframe, interval, snapshot } = req

    const sections: string[] = [`# Data snapshot for ${symbol}`]

    if (snapshot.profile) sections.push(profileSection(snapshot.profile))
    if (snapshot.financials) sections.push(financialsSection(snapshot.financials))
    if (snapshot.prices?.length) sections.push(priceSection(snapshot.prices, timeframe, interval))
    if (snapshot.metrics) sections.push(metricsSection(snapshot.metrics))

    const technicals = technicalsSection(snapshot)
    if (technicals) sections.push(technicals)

    if (snapshot.news?.length) sections.push(newsSection(snapshot.news, snapshot.newsInsights))

    sections.push(`## Question\n${question}\n\nAnalyse ${symbol} using the snapshot above and answer the question directly in the Bottom line.`)

    return sections.join("\n\n")
}
