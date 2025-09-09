import { type NextRequest, NextResponse } from "next/server"
import { notifyAnonymousChatMessage, notifyNewAnonymousSession } from "@/lib/multi-channel-notifications"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, sessionId, message, isFromUser } = body

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    switch (type) {
      case "new_message":
        await notifyAnonymousChatMessage(sessionId, message, isFromUser)
        break

      case "new_session":
        await notifyNewAnonymousSession(sessionId, message)
        break

      default:
        return NextResponse.json({ error: "Invalid notification type" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Notification API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
