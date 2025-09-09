import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import redisClient from "@/lib/redis-client"

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || user.userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized - admin access required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "active"

    // This is a simplified implementation
    // In production, you'd want to maintain an index of active sessions
    const client = await redisClient.connect()
    const sessionKeys = await client.keys("session:anon_*")

    const sessions = []
    for (const key of sessionKeys) {
      const sessionData = await client.get(key)
      if (sessionData) {
        const session = JSON.parse(sessionData)
        if (!status || session.status === status) {
          sessions.push({
            sessionId: session.sessionId,
            status: session.status,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            agentId: session.agentId,
            userIP: session.userIP?.substring(0, 8) + "...", // Partial IP for privacy
          })
        }
      }
    }

    // Sort by last activity (most recent first)
    sessions.sort((a, b) => b.lastActivity - a.lastActivity)

    return NextResponse.json({
      success: true,
      sessions,
      total: sessions.length,
    })
  } catch (error) {
    console.error("[v0] Error fetching admin sessions:", error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}
