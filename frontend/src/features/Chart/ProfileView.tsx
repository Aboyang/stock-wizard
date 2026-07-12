import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { useAppSelector } from "../../app/hooks"

import { useGetProfile, useGetFinancials } from "./query"
import type { IFinancials } from "./query"

import Modal from "../Modal/Modal"

import "./ProfileView.css"

const FIN_METRIC_INFO: Record<string, { what: string; how: string }> = {
    "Revenue": {
        what: "The total money the company brought in from sales over the period.",
        how: "Look for steady YoY growth; slowing or negative growth is a warning sign. Compare the growth rate to peers in the same sector.",
    },
    "Gross Profit": {
        what: "Revenue minus the direct cost of producing the goods or services sold.",
        how: "Gross profit rising as fast as (or faster than) revenue signals pricing power; shrinking margins suggest rising costs or discounting.",
    },
    "Free Cash Flow": {
        what: "Cash left over after running the business and paying for capital expenditures.",
        how: "Consistently positive FCF can fund dividends and buybacks without borrowing; negative FCF means the company is burning cash to grow.",
    },
    "Target Price": {
        what: "Analysts' average forecast of the share price over the next 12 months.",
        how: "Compare it with the current price — a target well above current implies analyst upside, but treat it as sentiment, not a guarantee.",
    },
    "EPS (TTM)": {
        what: "Profit per share earned over the trailing 12 months.",
        how: "Growing EPS supports a rising share price; compare against past quarters and use it to sanity-check the P/E ratio.",
    },
    "P/E Ratio": {
        what: "Share price divided by EPS — what you pay for each $1 of annual earnings.",
        how: "Compare with the sector P/E shown below — well above sector may mean overvalued (or high growth expectations); below sector may signal a bargain or trouble.",
    },
}

function Chip({ label, value }: { label: string; value: string | null | undefined }) {
    if (!value) return null
    return (
        <div className="profile-chip">
            <span className="profile-chip-label">{label}</span>
            <span className="profile-chip-value">{value}</span>
        </div>
    )
}

function formatBig(n: number | null | undefined): string {
    if (n == null || Number.isNaN(n)) return "—"
    const abs = Math.abs(n)
    if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
    if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
    if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
    if (abs >= 1e3) return `$${(n / 1e3).toFixed(2)}K`
    return `$${n.toFixed(2)}`
}

function formatPrice(n: number | null | undefined): string {
    if (n == null || Number.isNaN(n)) return "—"
    return `$${n.toFixed(2)}`
}

function formatNumber(n: number | null | undefined): string {
    if (n == null || Number.isNaN(n)) return "—"
    return n.toFixed(2)
}

function formatDate(d: string | Date | null | undefined): string {
    if (!d) return "—"
    const date = d instanceof Date ? d : new Date(d)
    if (Number.isNaN(date.getTime())) return "—"
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function formatYoY(n: number | null | undefined): string | null {
    if (n == null || Number.isNaN(n)) return null
    const pct = n * 100
    const sign = pct >= 0 ? "+" : ""
    return `${sign}${pct.toFixed(1)}% YoY`
}

interface IUpcomingEvent {
    label: string
    value: ReactNode
}

function sortEvents(financials: IFinancials): IUpcomingEvent[] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayMs = today.getTime()

    const candidates = [
        { label: "Next earnings", rawDate: financials.events?.earningsDate },
        { label: "Ex-dividend", rawDate: financials.events?.exDividendDate },
        { label: "Dividend pay", rawDate: financials.events?.dividendDate },
    ]

    return candidates
        .map((c) => ({ ...c, ms: c.rawDate ? new Date(c.rawDate).getTime() : NaN }))
        .filter((c) => !Number.isNaN(c.ms) && c.ms >= todayMs)
        .sort((a, b) => a.ms - b.ms)
        .map((c) => ({
            label: c.label,
            value: <span className="fin-event-value">{formatDate(c.rawDate)}</span>,
        }))
}

interface IStatCardProps {
    label: string
    value: string
    compare?: string | null
    yoy?: number | null
}

function StatCard({ label, value, compare, yoy }: IStatCardProps) {
    const [showModal, setShowModal] = useState(false)
    const yoyText = formatYoY(yoy)
    const yoyClass = yoy == null ? "" : yoy >= 0 ? " fin-stat-yoy-up" : " fin-stat-yoy-down"
    const info = FIN_METRIC_INFO[label]
    return (
        <div
            className="fin-stat"
            onMouseEnter={() => setShowModal(true)}
            onMouseLeave={() => setShowModal(false)}
        >
            {showModal && info && (
                <Modal modalContent={
                    <div className="modal-content">
                        <strong>{label}</strong>
                        <p>{info.what}</p>
                        <p><strong>How to use it:</strong> {info.how}</p>
                    </div>
                }/>
            )}
            <div className="fin-stat-value">{value}</div>
            <div className="fin-stat-label">{label}</div>
            {compare && <div className="fin-stat-compare">{compare}</div>}
            {yoyText && <div className={`fin-stat-yoy${yoyClass}`}>{yoyText}</div>}
        </div>
    )
}

function ProfileView() {
    const selectedSec = useAppSelector((state) => state.security.selectedSec)
    const { data: profile, isLoading } = useGetProfile(selectedSec)
    const { data: financials, isLoading: finLoading } = useGetFinancials(selectedSec)
    const [expanded, setExpanded] = useState(false)

    useEffect(() => { setExpanded(false) }, [selectedSec])

    return (
        <div className="profile-area">
            <div className="profile-panel">
                <h3>About {selectedSec}</h3>

                {isLoading && (
                    <div className="profile-skeleton">
                        <div className="profile-skeleton-bar" style={{ width: "30%" }} />
                        <div className="profile-skeleton-bar" style={{ width: "100%" }} />
                        <div className="profile-skeleton-bar" style={{ width: "100%" }} />
                        <div className="profile-skeleton-bar" style={{ width: "80%" }} />
                    </div>
                )}

                {!isLoading && !profile && (
                    <div className="profile-empty">No profile available for {selectedSec}.</div>
                )}

                {!isLoading && profile && (
                    <>
                        <div className="profile-meta">
                            <Chip label="Sector" value={profile.sector} />
                            <Chip label="Industry" value={profile.industry} />
                            <Chip label="Country" value={profile.country} />
                        </div>
                        {profile.summary && (
                            <div className="profile-summary-wrap">
                                <div className={`profile-summary${expanded ? "" : " profile-summary-clamped"}`}>
                                    {profile.summary}
                                </div>
                                <button
                                    type="button"
                                    className="profile-toggle"
                                    onClick={() => setExpanded(e => !e)}
                                >
                                    {expanded ? "Read less" : "Read more"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="profile-panel">
                <h3>Financials</h3>

                {finLoading && (
                    <div className="fin-grid">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="fin-stat fin-stat-skeleton">
                                <div className="profile-skeleton-bar" style={{ width: "70%" }} />
                                <div className="profile-skeleton-bar" style={{ width: "50%", height: 8 }} />
                            </div>
                        ))}
                    </div>
                )}

                {!finLoading && !financials && (
                    <div className="profile-empty">No financials available for {selectedSec}.</div>
                )}

                {!finLoading && financials && (
                    <>
                        <div className="fin-grid">
                            <StatCard label="Revenue" value={formatBig(financials.revenue)} yoy={financials.revenueYoY} />
                            <StatCard label="Gross Profit" value={formatBig(financials.grossProfit)} yoy={financials.grossProfitYoY} />
                            <StatCard label="Free Cash Flow" value={formatBig(financials.freeCashFlow)} yoy={financials.freeCashFlowYoY} />
                            <StatCard label="Target Price" value={formatPrice(financials.targetPrice)} />
                            <StatCard label="EPS (TTM)" value={formatNumber(financials.eps)} />
                            <StatCard
                                label="P/E Ratio"
                                value={formatNumber(financials.peRatio)}
                                compare={financials.sectorPE != null ? `Sector ${formatNumber(financials.sectorPE)}` : null}
                            />
                        </div>

                        {(() => {
                            const upcoming = sortEvents(financials)
                            return (
                                <div className="fin-events">
                                    <div className="fin-events-title">Upcoming events</div>
                                    {upcoming.length === 0 ? (
                                        <div className="fin-event-row">
                                            <span className="fin-event-label">No upcoming events</span>
                                        </div>
                                    ) : (
                                        upcoming.map(({ label, value }) => (
                                            <div key={label} className="fin-event-row">
                                                <span className="fin-event-label">{label}</span>
                                                {value}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )
                        })()}
                    </>
                )}
            </div>
        </div>
    )
}

export default ProfileView
