import { type NextRequest, NextResponse } from "next/server"
import { closeAnonymousSession, getSessionInfo, isValidSessionId } from "@/lib/anonymous-chat-utils"
import { getUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId || !isValidSessionId(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 })
    }

    // Verify session exists
    const session = await getSessionInfo(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Session not found or expired" }, { status: 404 })
    }

    // Only agents can close sessions, or allow auto-close
    const user = await getUser()
    if (user && user.userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized - agent access required" }, { status: 401 })
    }

    await closeAnonymousSession(sessionId)

    return NextResponse.json({
      success: true,
      message: "Chat session closed",
    })
  } catch (error) {
    console.error("[v0] Error closing session:", error)
    return NextResponse.json({ error: "Failed to close session" }, { status: 500 })
  }
}
