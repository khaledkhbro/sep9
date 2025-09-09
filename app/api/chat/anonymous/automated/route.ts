import { type NextRequest, NextResponse } from "next/server"
import { getSessionInfo, isValidSessionId } from "@/lib/anonymous-chat-utils"
import { sendAutomatedMessage, getAutomatedMessageTemplates } from "@/lib/automated-chat-messages"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { action, sessionId, messageType = "welcome", templateId } = await request.json()

    if (!sessionId || !isValidSessionId(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 })
    }

    // Verify session exists and is active
    const session = await getSessionInfo(sessionId)
    if (!session || session.status !== "active") {
      return NextResponse.json({ error: "Session not found or inactive" }, { status: 404 })
    }

    if (action === "send_template" && templateId) {
      // Send specific template by ID (for testing)
      const success = await sendAutomatedMessage(sessionId, templateId)

      if (success) {
        return NextResponse.json({
          success: true,
          message: "Template message sent successfully",
        })
      } else {
        return NextResponse.json({ error: "Failed to send template message" }, { status: 500 })
      }
    }

    // Get automated message template by type (legacy support)
    const { data: template, error } = await supabase
      .from("automated_message_templates")
      .select("*")
      .eq("type", messageType)
      .eq("is_active", true)
      .order("priority", { ascending: true })
      .limit(1)
      .single()

    if (error || !template) {
      return NextResponse.json({ error: "No active template found for message type" }, { status: 404 })
    }

    const success = await sendAutomatedMessage(sessionId, template.id)

    if (success) {
      return NextResponse.json({
        success: true,
        template: {
          id: template.id,
          name: template.name,
          type: template.type,
          delaySeconds: template.delay_seconds,
        },
      })
    } else {
      return NextResponse.json({ error: "Failed to send automated message" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Error sending automated message:", error)
    return NextResponse.json({ error: "Failed to send automated message" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const templates = await getAutomatedMessageTemplates()

    return NextResponse.json({
      success: true,
      templates,
    })
  } catch (error) {
    console.error("[v0] Error in automated messages GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
