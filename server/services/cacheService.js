import { createClient } from "redis"

const client = createClient({ url: process.env.REDIS_URL ?? "redis://localhost:6380" })

client.on("error", (err) => {
    console.error("Redis error:", err)
})

await client.connect()

export async function getCache(key) {
    const data = await client.get(key)
    return data ? JSON.parse(data) : null
}

export async function setCache(key, value, ttl = 300) {
    await client.set(key, JSON.stringify(value), {
        EX: ttl
    })
}
