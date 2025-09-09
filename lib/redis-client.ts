// Local Redis client configuration for anonymous chat system
import { createClient } from "redis"

class RedisClient {
  private client: any = null
  private isConnected = false

  async connect() {
    if (this.isConnected && this.client) {
      return this.client
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || "redis://localhost:6379",
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
        },
      })

      this.client.on("error", (err: any) => {
        console.error("[v0] Redis Client Error:", err)
        this.isConnected = false
      })

      this.client.on("connect", () => {
        console.log("[v0] Redis Client Connected")
        this.isConnected = true
      })

      await this.client.connect()
      return this.client
    } catch (error) {
      console.error("[v0] Failed to connect to Redis:", error)
      throw error
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.disconnect()
      this.isConnected = false
    }
  }

  async storeMessage(sessionId: string, message: any, ttl = 172800) {
    // 2 days TTL
    const client = await this.connect()
    const key = `chat:${sessionId}:messages`

    await client.lPush(
      key,
      JSON.stringify({
        ...message,
        timestamp: Date.now(),
      }),
    )

    // Set TTL for auto-deletion after 2 days
    await client.expire(key, ttl)
  }

  async getMessages(sessionId: string) {
    const client = await this.connect()
    const key = `chat:${sessionId}:messages`

    const messages = await client.lRange(key, 0, -1)
    return messages.map((msg: string) => JSON.parse(msg)).reverse()
  }

  async storeSession(sessionId: string, sessionData: any, ttl = 172800) {
    const client = await this.connect()
    const key = `session:${sessionId}`

    await client.setEx(
      key,
      ttl,
      JSON.stringify({
        ...sessionData,
        createdAt: Date.now(),
      }),
    )
  }

  async getSession(sessionId: string) {
    const client = await this.connect()
    const key = `session:${sessionId}`

    const session = await client.get(key)
    return session ? JSON.parse(session) : null
  }

  async deleteSession(sessionId: string) {
    const client = await this.connect()
    await client.del(`session:${sessionId}`)
    await client.del(`chat:${sessionId}:messages`)
  }

  async storeFCMToken(sessionId: string, token: string, ttl = 172800) {
    const client = await this.connect()
    const key = `fcm:${sessionId}`

    await client.setEx(key, ttl, token)
  }

  async getFCMToken(sessionId: string) {
    const client = await this.connect()
    const key = `fcm:${sessionId}`

    return await client.get(key)
  }
}

// Singleton instance
const redisClient = new RedisClient()

export default redisClient
