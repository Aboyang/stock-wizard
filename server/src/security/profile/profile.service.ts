import YahooFinance from "yahoo-finance2"
import { getCache, setCache } from "../../shared/cache.service.js"

const yf = new YahooFinance()

export interface ISecurityProfile {
    sector: string | null
    industry: string | null
    country: string | null
    summary: string | null
    website: string | null
    employees: number | null
}

// fetch company profile (sector, industry, country, business summary); cache-first (1h TTL)
export async function fetchProfile(symbol: string): Promise<ISecurityProfile> {
    const cacheKey = `profile:${symbol}`

    const cached = await getCache<ISecurityProfile>(cacheKey)
    if (cached) {
        console.log(`>>> [profile] cache hit for ${symbol}`)
        return cached
    }

    console.log(`>>> [profile] cache miss for ${symbol}, fetching from Yahoo`)
    const response = await yf.quoteSummary(symbol, { modules: ["assetProfile"] })
    const p = response.assetProfile

    const profile: ISecurityProfile = {
        sector: p?.sector || null,
        industry: p?.industry || null,
        country: p?.country || null,
        summary: p?.longBusinessSummary || null,
        website: p?.website || null,
        employees: p?.fullTimeEmployees || null,
    }

    await setCache(cacheKey, profile, 3600)
    return profile
}
