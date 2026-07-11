import { createClient } from "redis"

const client = createClient({ url: process.env.REDIS_URL ?? "redis://localhost:6380" })

client.on("error", (err: Error) => {
    console.error("Redis error:", err)
})

await client.connect()

export async function getCache<T>(key: string): Promise<T | null> {
    const data = await client.get(key)
    return data ? (JSON.parse(data) as T) : null
}

export async function setCache(key: string, value: unknown, ttl: number = 300): Promise<void> {
    await client.set(key, JSON.stringify(value), {
        EX: ttl
    })
}
