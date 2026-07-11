import { useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { useAppDispatch, useAppSelector } from "../../app/hooks"
import { addSymbol } from "../securitySlice"
import "./SettingsView.css"

const STORAGE_KEY = "stockWizard:preferences"
const TICKER_SENTINEL = "---TICKERS---"

const SUGGESTED_THEMES = [
    "AI", "Semiconductors", "Cloud", "Cybersecurity", "Fintech",
    "EV", "Clean Energy", "Biotech", "Healthcare", "Defense",
    "Real Estate", "Dividend", "Growth", "Value", "Small Cap",
    "Emerging Markets", "Crypto", "Consumer", "Aerospace", "Robotics",
]

export interface IPreferences {
    riskAppetite: number
    returnGoal: number
    timeHorizon: number
    themes: string[]
}

interface IRecommendedTicker {
    symbol: string
    allocation: number | null
}

const DEFAULTS: IPreferences = {
    riskAppetite: 5,
    returnGoal: 10,
    timeHorizon: 5,
    themes: [],
}

function loadPreferences(): IPreferences {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw === null) return DEFAULTS
        const parsed: unknown = JSON.parse(raw)
        if (typeof parsed !== "object" || parsed === null) return DEFAULTS
        return { ...DEFAULTS, ...parsed }
    } catch {
        return DEFAULTS
    }
}

function prefsEqual(a: IPreferences, b: IPreferences): boolean {
    if (a.riskAppetite !== b.riskAppetite) return false
    if (a.returnGoal !== b.returnGoal) return false
    if (a.timeHorizon !== b.timeHorizon) return false
    if (a.themes.length !== b.themes.length) return false
    const setB = new Set(b.themes)
    return a.themes.every((t) => setB.has(t))
}

function splitAtSentinel(buffer: string): { markdown: string; tail: string } {
    const idx = buffer.indexOf(TICKER_SENTINEL)
    if (idx === -1) return { markdown: buffer, tail: "" }
    return {
        markdown: buffer.slice(0, idx).trimEnd(),
        tail: buffer.slice(idx + TICKER_SENTINEL.length).trim(),
    }
}

function parseTickers(tail: string): IRecommendedTicker[] {
    if (!tail) return []
    try {
        const parsed: unknown = JSON.parse(tail)
        const tickers = (parsed as { tickers?: unknown })?.tickers
        const list: unknown[] = Array.isArray(tickers) ? tickers : []
        return list
            .map((t): { symbol: unknown; allocation: unknown } =>
                typeof t === "string"
                    ? { symbol: t, allocation: null }
                    : {
                        symbol: (t as { symbol?: unknown })?.symbol,
                        allocation: (t as { allocation?: unknown })?.allocation ?? null,
                    }
            )
            .filter((t): t is IRecommendedTicker => typeof t.symbol === "string" && t.symbol.length > 0)
    } catch {
        return []
    }
}

async function streamAdvisor(prefs: IPreferences, onChunk: (buffer: string) => void): Promise<string> {
    const baseUrl = import.meta.env.PROD ? "" : "http://localhost:5001"
    const res = await fetch(`${baseUrl}/api/advisor/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
    })

    if (!res.body) throw new Error("No response body")

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        onChunk(buffer)
    }

    return buffer
}

function SettingsView() {
    const dispatch = useAppDispatch()
    const watchlist = useAppSelector((s) => s.security.symbols)
    const watchlistSet = useMemo(
        () => new Set(watchlist.map((s) => s.toUpperCase())),
        [watchlist]
    )

    const [open, setOpen] = useState(false)
    const [savedPrefs, setSavedPrefs] = useState<IPreferences>(loadPreferences)
    const [draftPrefs, setDraftPrefs] = useState<IPreferences>(savedPrefs)

    const [analysing, setAnalysing] = useState(false)
    const [streamBuffer, setStreamBuffer] = useState("")
    const [addedTickers, setAddedTickers] = useState<Set<string>>(() => new Set())

    const abortRef = useRef(false)

    const dirty = !prefsEqual(draftPrefs, savedPrefs)
    const { markdown, tail } = useMemo(
        () => splitAtSentinel(streamBuffer),
        [streamBuffer]
    )
    const tickers = useMemo(() => parseTickers(tail), [tail])
    const streamingComplete = !analysing && streamBuffer.length > 0

    function update<K extends keyof IPreferences>(key: K, value: IPreferences[K]) {
        setDraftPrefs((p) => ({ ...p, [key]: value }))
    }

    function toggleTheme(theme: string) {
        setDraftPrefs((p) => ({
            ...p,
            themes: p.themes.includes(theme)
                ? p.themes.filter((t) => t !== theme)
                : [...p.themes, theme],
        }))
    }

    async function handleConfirm() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(draftPrefs))
        } catch {
            // quota / disabled storage — ignore
        }
        setSavedPrefs(draftPrefs)

        setAddedTickers(new Set())
        setStreamBuffer("")
        setAnalysing(true)
        abortRef.current = false

        try {
            await streamAdvisor(draftPrefs, (buf) => {
                if (abortRef.current) return
                setStreamBuffer(buf)
            })
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            setStreamBuffer((b) => b + `\n\n_Error: ${message}_`)
        } finally {
            setAnalysing(false)
        }
    }

    function handleAddTicker(symbol: string) {
        const upper = symbol.toUpperCase()
        if (watchlistSet.has(upper)) return
        dispatch(addSymbol(upper))
        setAddedTickers((prev) => {
            const next = new Set(prev)
            next.add(upper)
            return next
        })
    }

    useEffect(() => {
        return () => {
            abortRef.current = true
        }
    }, [])

    const riskLabel = ["Very Low", "Low", "Moderate", "High", "Very High"][
        Math.min(4, Math.floor((draftPrefs.riskAppetite - 1) / 2))
    ]

    return (
        <>
            <div
                className="settings-icon-btn"
                onClick={() => setOpen(true)}
                aria-label="Open settings"
            >
                <i className="fa-solid fa-gear"></i>
            </div>

            {open && (
                <div className="settings-overlay" onClick={() => setOpen(false)} />
            )}

            <aside className={`settings-panel ${open ? "open" : ""}`}>

                <div className="settings-header">
                    <h3>Preferences</h3>
                    <div
                        className="settings-close"
                        onClick={() => setOpen(false)}
                        aria-label="Close settings"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </div>
                </div>

                <div className="settings-body">

                    <div className="settings-field">
                        <div className="settings-field-row">
                            <label>Risk Appetite</label>
                            <span className="settings-value">{riskLabel} ({draftPrefs.riskAppetite}/10)</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            step="1"
                            value={draftPrefs.riskAppetite}
                            onChange={(e) => update("riskAppetite", Number(e.target.value))}
                        />
                        <div className="settings-scale">
                            <span>Conservative</span>
                            <span>Aggressive</span>
                        </div>
                    </div>

                    <div className="settings-field">
                        <div className="settings-field-row">
                            <label>Return Goal</label>
                            <span className="settings-value">{draftPrefs.returnGoal}% / yr</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="50"
                            step="1"
                            value={draftPrefs.returnGoal}
                            onChange={(e) => update("returnGoal", Number(e.target.value))}
                        />
                        <div className="settings-scale">
                            <span>0%</span>
                            <span>50%</span>
                        </div>
                    </div>

                    <div className="settings-field">
                        <div className="settings-field-row">
                            <label>Time Horizon</label>
                            <span className="settings-value">
                                {draftPrefs.timeHorizon} {draftPrefs.timeHorizon === 1 ? "year" : "years"}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            step="1"
                            value={draftPrefs.timeHorizon}
                            onChange={(e) => update("timeHorizon", Number(e.target.value))}
                        />
                        <div className="settings-scale">
                            <span>1 yr</span>
                            <span>30 yrs</span>
                        </div>
                    </div>

                    <div className="settings-field">
                        <div className="settings-field-row">
                            <label>Themes</label>
                            <span className="settings-value">{draftPrefs.themes.length} selected</span>
                        </div>
                        <div className="settings-themes">
                            {SUGGESTED_THEMES.map((theme) => (
                                <div
                                    key={theme}
                                    className={`settings-chip ${draftPrefs.themes.includes(theme) ? "active" : ""}`}
                                    onClick={() => toggleTheme(theme)}
                                >
                                    {theme}
                                </div>
                            ))}
                        </div>
                    </div>

                    {(dirty || analysing) && (
                        <button
                            className={`settings-confirm ${analysing ? "analysing" : ""}`}
                            onClick={handleConfirm}
                            disabled={analysing || !dirty}
                        >
                            {analysing ? (
                                <span className="shimmer-text">Analysing...</span>
                            ) : (
                                "Confirm changes"
                            )}
                        </button>
                    )}

                    {(analysing || streamBuffer) && (
                        <div className="advisor-output">
                            {markdown ? (
                                <div className="advisor-markdown">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {markdown}
                                    </ReactMarkdown>
                                    {analysing && <span className="streaming-cursor">▍</span>}
                                </div>
                            ) : (
                                <div className="shimmer-lines">
                                    <div className="shimmer-line shimmer-line--long" />
                                    <div className="shimmer-line shimmer-line--medium" />
                                    <div className="shimmer-line shimmer-line--short" />
                                </div>
                            )}

                            {streamingComplete && tickers.length > 0 && (
                                <div className="advisor-watchlist">
                                    <div className="advisor-watchlist-label">
                                        Add these to watchlist?
                                    </div>
                                    <div className="advisor-tickers">
                                        {tickers.map(({ symbol, allocation }) => {
                                            const upper = symbol.toUpperCase()
                                            const inWatchlist = watchlistSet.has(upper)
                                            const justAdded = addedTickers.has(upper)
                                            return (
                                                <div
                                                    key={upper}
                                                    className={`advisor-ticker ${inWatchlist || justAdded ? "added" : ""}`}
                                                    onClick={() => handleAddTicker(upper)}
                                                >
                                                    <span className="advisor-ticker-symbol">{upper}</span>
                                                    {allocation !== null && allocation !== undefined && (
                                                        <span className="advisor-ticker-alloc">{allocation}%</span>
                                                    )}
                                                    {(inWatchlist || justAdded) && (
                                                        <i className="fa-solid fa-check advisor-ticker-check"></i>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>

            </aside>
        </>
    )
}

export default SettingsView
