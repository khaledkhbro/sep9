import { type NextRequest, NextResponse } from "next/server"
import { createAnonymousSession, getSessionInfo, isValidSessionId } from "@/lib/anonymous-chat-utils"
import { triggerWelcomeMessage, scheduleAutomatedMessages } from "@/lib/automated-chat-messages"
import { notifyNewAnonymousSession } from "@/lib/multi-channel-notifications"

export async function POST(request: NextRequest) {
  try {
    const userIP = request.ip || request.headers.get("x-forwarded-for") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    const sessionId = await createAnonymousSession(userIP, userAgent)

    try {
      await triggerWelcomeMessage(sessionId)
      await scheduleAutomatedMessages(sessionId)
      await notifyNewAnonymousSession(sessionId)
    } catch (automationError) {
      console.error("[v0] Failed to setup automation for session:", automationError)
      // Don't fail session creation if automation fails
    }

    return NextResponse.json({
      success: true,
      sessionId,
      message: "Anonymous chat session created",
    })
  } catch (error) {
    console.error("[v0] Error creating anonymous session:", error)
    return NextResponse.json({ error: "Failed to create chat session" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId || !isValidSessionId(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 })
    }

    const session = await getSessionInfo(sessionId)

    if (!session) {
      return NextResponse.json({ error: "Session not found or expired" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        status: session.status,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        agentId: session.agentId,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching session:", error)
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 })
  }
}
