import { createClient } from "@supabase/supabase-js"
import { redisClient } from "./redis-client"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export interface AutomatedMessageTemplate {
  id: number
  name: string
  type: "welcome" | "proactive" | "follow_up" | "closing"
  trigger_condition: string
  message_content: string
  is_active: boolean
  priority: number
  delay_seconds: number
  variables: Record<string, any>
}

export interface ChatAutomationSettings {
  welcome_message_enabled: boolean
  proactive_messages_enabled: boolean
  business_hours_start: string
  business_hours_end: string
  business_days: string[]
  idle_timeout_minutes: number
  no_response_timeout_minutes: number
  max_proactive_messages: number
  queue_update_interval_minutes: number
  auto_close_timeout_minutes: number
}

// Get automation settings
export async function getChatAutomationSettings(): Promise<ChatAutomationSettings> {
  try {
    const { data, error } = await supabase.from("chat_automation_settings").select("setting_key, setting_value")

    if (error) throw error

    const settings: any = {}
    data?.forEach(({ setting_key, setting_value }) => {
      if (setting_key === "business_days") {
        settings[setting_key] = setting_value.split(",")
      } else if (setting_key.includes("_minutes") || setting_key.includes("max_")) {
        settings[setting_key] = Number.parseInt(setting_value)
      } else if (setting_key.includes("_enabled")) {
        settings[setting_key] = setting_value === "true"
      } else {
        settings[setting_key] = setting_value
      }
    })

    return settings
  } catch (error) {
    console.error("[v0] Failed to get automation settings:", error)
    // Return default settings
    return {
      welcome_message_enabled: true,
      proactive_messages_enabled: true,
      business_hours_start: "09:00",
      business_hours_end: "18:00",
      business_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      idle_timeout_minutes: 5,
      no_response_timeout_minutes: 10,
      max_proactive_messages: 3,
      queue_update_interval_minutes: 2,
      auto_close_timeout_minutes: 30,
    }
  }
}

// Get automated message templates
export async function getAutomatedMessageTemplates(type?: string): Promise<AutomatedMessageTemplate[]> {
  try {
    let query = supabase
      .from("automated_message_templates")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: true })

    if (type) {
      query = query.eq("type", type)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("[v0] Failed to get automated message templates:", error)
    return []
  }
}

// Process message variables
export function processMessageVariables(content: string, variables: Record<string, any>): string {
  let processedContent = content

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g")
    processedContent = processedContent.replace(regex, String(value))
  })

  return processedContent
}

// Check if within business hours
export function isWithinBusinessHours(settings: ChatAutomationSettings): boolean {
  const now = new Date()
  const currentDay = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
  const currentTime = now.toTimeString().slice(0, 5) // HH:MM format

  // Check if current day is a business day
  if (!settings.business_days.includes(currentDay)) {
    return false
  }

  // Check if current time is within business hours
  return currentTime >= settings.business_hours_start && currentTime <= settings.business_hours_end
}

// Send automated message
export async function sendAutomatedMessage(
  sessionId: string,
  templateId: number,
  variables: Record<string, any> = {},
): Promise<boolean> {
  try {
    // Get template
    const { data: template, error } = await supabase
      .from("automated_message_templates")
      .select("*")
      .eq("id", templateId)
      .eq("is_active", true)
      .single()

    if (error || !template) {
      console.error("[v0] Template not found or inactive:", templateId)
      return false
    }

    // Process message content with variables
    const processedContent = processMessageVariables(template.message_content, {
      ...template.variables,
      ...variables,
    })

    // Add delay if specified
    if (template.delay_seconds > 0) {
      await new Promise((resolve) => setTimeout(resolve, template.delay_seconds * 1000))
    }

    // Store message in Redis (temporary storage)
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const message = {
      id: messageId,
      sessionId,
      content: processedContent,
      isFromUser: false,
      isAutomated: true,
      templateId,
      timestamp: new Date().toISOString(),
    }

    await redisClient.lpush(`chat:${sessionId}:messages`, JSON.stringify(message))
    await redisClient.expire(`chat:${sessionId}:messages`, 172800) // 2 days

    // Log the automated message
    await supabase.from("automated_message_logs").insert({
      session_id: sessionId,
      template_id: templateId,
      message_content: processedContent,
      trigger_type: template.trigger_condition,
      success: true,
    })

    console.log("[v0] Automated message sent:", { sessionId, templateId, content: processedContent })
    return true
  } catch (error) {
    console.error("[v0] Failed to send automated message:", error)

    // Log failed attempt
    await supabase.from("automated_message_logs").insert({
      session_id: sessionId,
      template_id: templateId,
      message_content: "Failed to send",
      trigger_type: "error",
      success: false,
    })

    return false
  }
}

// Trigger welcome message
export async function triggerWelcomeMessage(sessionId: string): Promise<void> {
  try {
    const settings = await getChatAutomationSettings()

    if (!settings.welcome_message_enabled) {
      return
    }

    const templates = await getAutomatedMessageTemplates("welcome")
    if (templates.length === 0) {
      return
    }

    const welcomeTemplate = templates[0] // Use first (highest priority) welcome template

    // Add business hours context if outside hours
    const variables: Record<string, any> = {}
    if (!isWithinBusinessHours(settings)) {
      const businessHoursTemplates = await getAutomatedMessageTemplates("proactive")
      const businessHoursTemplate = businessHoursTemplates.find((t) => t.trigger_condition === "outside_hours")

      if (businessHoursTemplate) {
        await sendAutomatedMessage(sessionId, businessHoursTemplate.id, variables)
        return
      }
    }

    await sendAutomatedMessage(sessionId, welcomeTemplate.id, variables)
  } catch (error) {
    console.error("[v0] Failed to trigger welcome message:", error)
  }
}

// Trigger idle message
export async function triggerIdleMessage(sessionId: string): Promise<void> {
  try {
    const settings = await getChatAutomationSettings()

    if (!settings.proactive_messages_enabled) {
      return
    }

    // Check if we've already sent max proactive messages
    const { data: sentMessages } = await supabase
      .from("automated_message_logs")
      .select("id")
      .eq("session_id", sessionId)
      .in("trigger_type", ["idle_5min", "no_response_10min"])

    if (sentMessages && sentMessages.length >= settings.max_proactive_messages) {
      return
    }

    const templates = await getAutomatedMessageTemplates("proactive")
    const idleTemplate = templates.find((t) => t.trigger_condition === "idle_5min")

    if (idleTemplate) {
      await sendAutomatedMessage(sessionId, idleTemplate.id)
    }
  } catch (error) {
    console.error("[v0] Failed to trigger idle message:", error)
  }
}

// Trigger no response follow-up
export async function triggerNoResponseMessage(sessionId: string): Promise<void> {
  try {
    const settings = await getChatAutomationSettings()

    if (!settings.proactive_messages_enabled) {
      return
    }

    const templates = await getAutomatedMessageTemplates("follow_up")
    const noResponseTemplate = templates.find((t) => t.trigger_condition === "no_response_10min")

    if (noResponseTemplate) {
      await sendAutomatedMessage(sessionId, noResponseTemplate.id)
    }
  } catch (error) {
    console.error("[v0] Failed to trigger no response message:", error)
  }
}

// Schedule automated messages for a session
export async function scheduleAutomatedMessages(sessionId: string): Promise<void> {
  try {
    const settings = await getChatAutomationSettings()

    // Schedule idle message
    if (settings.proactive_messages_enabled) {
      setTimeout(
        () => {
          triggerIdleMessage(sessionId)
        },
        settings.idle_timeout_minutes * 60 * 1000,
      )

      // Schedule no response message
      setTimeout(
        () => {
          triggerNoResponseMessage(sessionId)
        },
        settings.no_response_timeout_minutes * 60 * 1000,
      )
    }

    console.log("[v0] Automated messages scheduled for session:", sessionId)
  } catch (error) {
    console.error("[v0] Failed to schedule automated messages:", error)
  }
}
