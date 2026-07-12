import { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useQueryClient } from "@tanstack/react-query"
import { useStore } from "react-redux"

import { useAppSelector } from "../../app/hooks"
import type { TRootState } from "../../app/store"
import type { ISecuritySnapshot } from "../analysisSlice"
import { ensureCompleteSnapshot } from "./buildSnapshot"
import "./ChatbotView.css"

type TChatPhase = "idle" | "gathering" | "streaming" | "done" | "error"

const SUGGESTED_QUESTIONS = [
    "Help me analyse this stock",
    "How risky is this stock right now?",
    "What does the latest news mean for this stock?",
    "Should I buy, hold, or sell?",
]

interface IAnalysisRequest {
    symbol: string
    question: string
    timeframe: string
    interval: string
    snapshot: ISecuritySnapshot
}

async function streamAnalysis(body: IAnalysisRequest, onChunk: (buffer: string) => void): Promise<string> {
    const baseUrl = import.meta.env.PROD ? "" : "http://localhost:5001"
    const res = await fetch(`${baseUrl}/api/analysis/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error(await res.text())
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

function ChatbotView() {
    const selectedSec = useAppSelector((s) => s.security.selectedSec)
    const form = useAppSelector((s) => s.form)
    const queryClient = useQueryClient()
    const store = useStore<TRootState>()

    const [open, setOpen] = useState(false)
    const [phase, setPhase] = useState<TChatPhase>("idle")
    const [activeQuestion, setActiveQuestion] = useState("")
    const [streamBuffer, setStreamBuffer] = useState("")
    const [errorMessage, setErrorMessage] = useState("")

    const abortRef = useRef(false)
    const bodyRef = useRef<HTMLDivElement | null>(null)
    const pinnedToTail = useRef(true)

    useEffect(() => {
        return () => {
            abortRef.current = true
        }
    }, [])

    // follow the tail of the streaming message, unless the user scrolled up to re-read
    function handleBodyScroll() {
        const body = bodyRef.current
        if (!body) return
        pinnedToTail.current = body.scrollHeight - body.scrollTop - body.clientHeight < 80
    }

    useEffect(() => {
        const body = bodyRef.current
        if (!body || !pinnedToTail.current) return
        body.scrollTop = body.scrollHeight
    }, [streamBuffer, phase])

    // a new selection makes the previous answer stale — go back to the questions
    useEffect(() => {
        setPhase("idle")
        setStreamBuffer("")
        setActiveQuestion("")
    }, [selectedSec])

    const busy = phase === "gathering" || phase === "streaming"
    const hasSelection = selectedSec !== ""

    async function handleAsk(question: string) {
        if (busy || !hasSelection) return

        const symbol = selectedSec
        setActiveQuestion(question)
        setStreamBuffer("")
        setErrorMessage("")
        setPhase("gathering")
        abortRef.current = false
        pinnedToTail.current = true

        try {
            await ensureCompleteSnapshot(queryClient, symbol, form)
            if (abortRef.current) return

            const snapshot = store.getState().analysis.snapshots[symbol] ?? {}

            setPhase("streaming")
            await streamAnalysis(
                { symbol, question, timeframe: form.timeframe, interval: form.interval, snapshot },
                (buf) => {
                    if (!abortRef.current) setStreamBuffer(buf)
                }
            )
            if (!abortRef.current) setPhase("done")
        } catch (err) {
            if (abortRef.current) return
            setErrorMessage(err instanceof Error ? err.message : String(err))
            setPhase("error")
        }
    }

    function handleReset() {
        setPhase("idle")
        setStreamBuffer("")
        setActiveQuestion("")
        setErrorMessage("")
    }

    return (
        <>
            <div
                className="chatbot-icon-btn"
                onClick={() => setOpen(true)}
                aria-label="Open assistant"
            >
                <i className="fa-solid fa-robot"></i>
            </div>

            {open && (
                <div className="chatbot-overlay" onClick={() => setOpen(false)} />
            )}

            <aside className={`chatbot-panel ${open ? "open" : ""}`}>

                <div className="chatbot-header">
                    <h3>
                        Stock Assistant
                        {hasSelection && <span className="chatbot-symbol">{selectedSec}</span>}
                    </h3>
                    <div
                        className="chatbot-close"
                        onClick={() => setOpen(false)}
                        aria-label="Close assistant"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </div>
                </div>

                <div className="chatbot-body" ref={bodyRef} onScroll={handleBodyScroll}>

                    {!hasSelection ? (
                        <div className="chatbot-empty">
                            <i className="fa-solid fa-hand-pointer"></i>
                            <p>Select a stock card first, then ask me about it.</p>
                        </div>
                    ) : phase === "idle" ? (
                        <>
                            <p className="chatbot-intro">
                                I have {selectedSec}'s prices, profile, financials, news and technicals ready. What would you like to know?
                            </p>
                            <div className="chatbot-questions">
                                {SUGGESTED_QUESTIONS.map((question) => (
                                    <div
                                        key={question}
                                        className="chatbot-question"
                                        onClick={() => handleAsk(question)}
                                    >
                                        {question}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="chatbot-asked">{activeQuestion}</div>

                            {phase === "gathering" && (
                                <div className="chatbot-output">
                                    <div className="chatbot-gathering shimmer-dark">Gathering {selectedSec} data...</div>
                                    <div className="chatbot-shimmer-lines">
                                        <div className="chatbot-shimmer-line chatbot-shimmer-line--long" />
                                        <div className="chatbot-shimmer-line chatbot-shimmer-line--medium" />
                                        <div className="chatbot-shimmer-line chatbot-shimmer-line--short" />
                                    </div>
                                </div>
                            )}

                            {(phase === "streaming" || phase === "done") && (
                                <div className="chatbot-output">
                                    <div className="chatbot-markdown">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {streamBuffer}
                                        </ReactMarkdown>
                                        {phase === "streaming" && <span className="chatbot-cursor">▍</span>}
                                    </div>
                                </div>
                            )}

                            {phase === "error" && (
                                <div className="chatbot-output chatbot-error">
                                    Something went wrong: {errorMessage}
                                </div>
                            )}

                            {(phase === "done" || phase === "error") && (
                                <button className="chatbot-reset" onClick={handleReset}>
                                    Ask another question
                                </button>
                            )}
                        </>
                    )}

                </div>

            </aside>
        </>
    )
}

export default ChatbotView
