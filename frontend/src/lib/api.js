const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001"

async function parseOrThrow(res) {
    if (!res.ok) {
        const message = await res.text().catch(() => res.statusText)
        throw new Error(message || `Request failed with ${res.status}`)
    }
    return res.json()
}

export async function apiGet(path, params) {
    const query = params ? "?" + new URLSearchParams(params).toString() : ""
    const res = await fetch(`${BASE_URL}${path}${query}`)
    return parseOrThrow(res)
}

export async function apiPost(path, body) {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
    return parseOrThrow(res)
}
