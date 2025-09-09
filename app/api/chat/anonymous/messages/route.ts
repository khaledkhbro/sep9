import { type NextRequest, NextResponse } from "next/server"
import { sendAnonymousMessage, getSessionMessages, getSessionInfo, isValidSessionId } from "@/lib/anonymous-chat-utils"
import { getUser } from "@/lib/auth"
import { notifyAnonymousChatMessage } from "@/lib/multi-channel-notifications"

export async function POST(request: NextRequest) {
  try {
    const { sessionId, content, senderType = "user", messageType = "text" } = await request.json()

    if (!sessionId || !content) {
      return NextResponse.json({ error: "Missing sessionId or content" }, { status: 400 })
    }

    if (!isValidSessionId(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID format" }, { status: 400 })
    }

    // Verify session exists and is active
    const session = await getSessionInfo(sessionId)
    if (!session || session.status !== "active") {
      return NextResponse.json({ error: "Session not found or inactive" }, { status: 404 })
    }

    let agentId: string | undefined

    // If message is from agent, verify authentication
    if (senderType === "agent") {
      const user = await getUser()
      if (!user || user.userType !== "admin") {
        return NextResponse.json({ error: "Unauthorized - agent access required" }, { status: 401 })
      }
      agentId = user.id
    }

    const message = await sendAnonymousMessage(sessionId, content, senderType, messageType, agentId)

    try {
      await notifyAnonymousChatMessage(sessionId, content, senderType === "user")
    } catch (notificationError) {
      console.error("[v0] Failed to send notification:", notificationError)
      // Don't fail the message send if notification fails
    }

    return NextResponse.json({
      success: true,
      message,
    })
  } catch (error) {
    console.error("[v0] Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId || !isValidSessionId(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 })
    }

    // Verify session exists
    const session = await getSessionInfo(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Session not found or expired" }, { status: 404 })
    }

    const messages = await getSessionMessages(sessionId)

    return NextResponse.json({
      success: true,
      messages,
      sessionStatus: session.status,
    })
  } catch (error) {
    console.error("[v0] Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}
