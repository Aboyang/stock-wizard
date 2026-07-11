import { useAppSelector } from "../../app/hooks"

import { useGetNews, useGetNewsInsights } from "./query"
import type { INewsInsight } from "./query"

import "./NewsView.css"

function formatRelativeTime(value: string | Date | null | undefined): string {
    if (!value) return ""
    const ms = value instanceof Date ? value.getTime() : new Date(value).getTime()
    if (Number.isNaN(ms)) return ""
    const seconds = Math.floor((Date.now() - ms) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    const months = Math.floor(days / 30)
    return `${months}mo ago`
}

interface IInsightFieldProps {
    label: string
    value: string | undefined
    pending: boolean
    lines?: number
    variant?: "recommendation"
}

function InsightField({ label, value, pending, lines = 2, variant }: IInsightFieldProps) {
    const sectionClass = `news-section${variant === "recommendation" ? " news-recommendation" : ""}`

    return (
        <div className={sectionClass}>
            <div className="news-label">{label}</div>
            {pending ? (
                <div className="news-skeleton">
                    {Array.from({ length: lines }).map((_, i) => (
                        <div key={i} className="news-skeleton-bar" style={{ width: i === lines - 1 ? "70%" : "100%" }} />
                    ))}
                    <div className="news-skeleton-caption">Summarising...</div>
                </div>
            ) : (
                <div className="news-text">{value || "—"}</div>
            )}
        </div>
    )
}

function NewsView() {
    const selectedSec = useAppSelector((state) => state.security.selectedSec)
    const { data: news, isLoading } = useGetNews(selectedSec)
    const { data: insights, isLoading: insightsLoading } = useGetNewsInsights(selectedSec, { enabled: !!news })

    const insightFor = (uuid: string): INewsInsight | null => insights?.find(i => i.uuid === uuid) || null

    return (
        <div className="news-area">
            <h3>Latest News</h3>

            {isLoading && <div className="news-empty">Loading news...</div>}

            {!isLoading && (!news || news.length === 0) && (
                <div className="news-empty">No recent news for {selectedSec}.</div>
            )}

            {!isLoading && news && news.length > 0 && (
                <div className="news-grid">
                    {news.map((item) => {
                        const ai = insightFor(item.uuid)
                        const aiPending = insightsLoading || !ai

                        return (
                            <a
                                key={item.uuid}
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="news-card"
                            >
                                {item.thumbnail ? (
                                    <div
                                        className="news-thumbnail"
                                        style={{ backgroundImage: `url(${item.thumbnail})` }}
                                    />
                                ) : (
                                    <div className="news-thumbnail news-thumbnail-fallback" />
                                )}

                                <div className="news-body">
                                    <div className="news-title">{item.title}</div>

                                    <InsightField label="Summary" value={ai?.summary} pending={aiPending} lines={2} />
                                    <InsightField label="Insight" value={ai?.insight} pending={aiPending} lines={2} />
                                    <InsightField label="Recommendation" value={ai?.recommendation} pending={aiPending} lines={1} variant="recommendation" />

                                    <div className="news-meta">
                                        <span className="news-publisher">{item.publisher}</span>
                                        <span className="news-time">{formatRelativeTime(item.providerPublishTime)}</span>
                                    </div>
                                </div>
                            </a>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default NewsView
