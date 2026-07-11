const BASE_URL = import.meta.env.PROD ? "" : "http://localhost:5001"

export type TQueryParams = Record<string, string | number | boolean>

async function parseOrThrow<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const message = await res.text().catch(() => res.statusText)
        throw new Error(message || `Request failed with ${res.status}`)
    }
    return res.json() as Promise<T>
}

export async function apiGet<T>(path: string, params?: TQueryParams): Promise<T> {
    const query = params
        ? "?" + new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString()
        : ""
    const res = await fetch(`${BASE_URL}${path}${query}`)
    return parseOrThrow<T>(res)
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
    return parseOrThrow<T>(res)
}
