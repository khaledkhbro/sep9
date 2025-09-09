import { sendPushNotification, type PushNotificationPayload, NotificationTypes } from "./firebase-fcm"

export interface NotificationChannel {
  type: "telegram" | "whatsapp" | "facebook" | "fcm"
  enabled: boolean
  config: Record<string, any>
}

export interface MultiChannelNotificationPayload {
  title: string
  message: string
  sessionId?: string
  userId?: string
  agentId?: string
  priority: "low" | "normal" | "high" | "urgent"
  channels: NotificationChannel[]
}

// Telegram Bot API integration
export async function sendTelegramNotification(chatId: string, message: string, botToken: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    })

    const result = await response.json()
    console.log("[v0] Telegram notification sent:", result.ok)
    return result.ok
  } catch (error) {
    console.error("[v0] Failed to send Telegram notification:", error)
    return false
  }
}

// WhatsApp Business API integration (via Twilio)
export async function sendWhatsAppNotification(
  to: string,
  message: string,
  twilioConfig: { accountSid: string; authToken: string; fromNumber: string },
): Promise<boolean> {
  try {
    const auth = Buffer.from(`${twilioConfig.accountSid}:${twilioConfig.authToken}`).toString("base64")

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioConfig.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: `whatsapp:${twilioConfig.fromNumber}`,
          To: `whatsapp:${to}`,
          Body: message,
        }),
      },
    )

    const result = await response.json()
    console.log("[v0] WhatsApp notification sent:", result.sid ? true : false)
    return !!result.sid
  } catch (error) {
    console.error("[v0] Failed to send WhatsApp notification:", error)
    return false
  }
}

// Facebook Messenger API integration
export async function sendFacebookMessengerNotification(
  recipientId: string,
  message: string,
  pageAccessToken: string,
): Promise<boolean> {
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
      }),
    })

    const result = await response.json()
    console.log("[v0] Facebook Messenger notification sent:", result.message_id ? true : false)
    return !!result.message_id
  } catch (error) {
    console.error("[v0] Failed to send Facebook Messenger notification:", error)
    return false
  }
}

// Main multi-channel notification sender
export async function sendMultiChannelNotification(
  payload: MultiChannelNotificationPayload,
): Promise<{ success: boolean; results: Record<string, boolean> }> {
  const results: Record<string, boolean> = {}
  let overallSuccess = false

  console.log("[v0] Sending multi-channel notification:", payload.title)

  for (const channel of payload.channels) {
    if (!channel.enabled) {
      results[channel.type] = false
      continue
    }

    try {
      let success = false

      switch (channel.type) {
        case "telegram":
          if (channel.config.botToken && channel.config.chatId) {
            success = await sendTelegramNotification(
              channel.config.chatId,
              `🔔 ${payload.title}\n\n${payload.message}`,
              channel.config.botToken,
            )
          }
          break

        case "whatsapp":
          if (
            channel.config.accountSid &&
            channel.config.authToken &&
            channel.config.fromNumber &&
            channel.config.toNumber
          ) {
            success = await sendWhatsAppNotification(
              channel.config.toNumber,
              `${payload.title}\n\n${payload.message}`,
              {
                accountSid: channel.config.accountSid,
                authToken: channel.config.authToken,
                fromNumber: channel.config.fromNumber,
              },
            )
          }
          break

        case "facebook":
          if (channel.config.pageAccessToken && channel.config.recipientId) {
            success = await sendFacebookMessengerNotification(
              channel.config.recipientId,
              `${payload.title}\n\n${payload.message}`,
              channel.config.pageAccessToken,
            )
          }
          break

        case "fcm":
          if (payload.userId) {
            const fcmPayload: PushNotificationPayload = {
              title: payload.title,
              body: payload.message,
              icon: "/icons/chat.png",
              data: {
                sessionId: payload.sessionId,
                type: "anonymous_chat",
                priority: payload.priority,
              },
            }
            success = await sendPushNotification(payload.userId, fcmPayload, NotificationTypes.NEW_MESSAGE)
          }
          break
      }

      results[channel.type] = success
      if (success) overallSuccess = true
    } catch (error) {
      console.error(`[v0] Failed to send ${channel.type} notification:`, error)
      results[channel.type] = false
    }
  }

  return { success: overallSuccess, results }
}

// Anonymous chat specific notification
export async function notifyAnonymousChatMessage(sessionId: string, message: string, isFromUser = true): Promise<void> {
  try {
    // Get notification settings from environment or database
    const channels: NotificationChannel[] = []

    // Telegram channel
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      channels.push({
        type: "telegram",
        enabled: true,
        config: {
          botToken: process.env.TELEGRAM_BOT_TOKEN,
          chatId: process.env.TELEGRAM_CHAT_ID,
        },
      })
    }

    // WhatsApp channel
    if (
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.WHATSAPP_FROM &&
      process.env.WHATSAPP_TO
    ) {
      channels.push({
        type: "whatsapp",
        enabled: true,
        config: {
          accountSid: process.env.TWILIO_ACCOUNT_SID,
          authToken: process.env.TWILIO_AUTH_TOKEN,
          fromNumber: process.env.WHATSAPP_FROM,
          toNumber: process.env.WHATSAPP_TO,
        },
      })
    }

    // Facebook Messenger channel
    if (process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_RECIPIENT_ID) {
      channels.push({
        type: "facebook",
        enabled: true,
        config: {
          pageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
          recipientId: process.env.FACEBOOK_RECIPIENT_ID,
        },
      })
    }

    // FCM channel (for agents)
    channels.push({
      type: "fcm",
      enabled: true,
      config: {},
    })

    if (channels.length === 0) {
      console.log("[v0] No notification channels configured")
      return
    }

    const title = isFromUser ? "New Anonymous Chat Message" : "Chat Response Sent"
    const fullMessage = `Session: ${sessionId.substring(0, 8)}...\n\nMessage: ${message.substring(0, 200)}${message.length > 200 ? "..." : ""}`

    await sendMultiChannelNotification({
      title,
      message: fullMessage,
      sessionId,
      priority: "normal",
      channels,
    })
  } catch (error) {
    console.error("[v0] Failed to send anonymous chat notification:", error)
  }
}

// Agent notification for new anonymous sessions
export async function notifyNewAnonymousSession(sessionId: string, initialMessage?: string): Promise<void> {
  try {
    const channels: NotificationChannel[] = []

    // Add all configured channels
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      channels.push({
        type: "telegram",
        enabled: true,
        config: {
          botToken: process.env.TELEGRAM_BOT_TOKEN,
          chatId: process.env.TELEGRAM_CHAT_ID,
        },
      })
    }

    if (process.env.TWILIO_ACCOUNT_SID && process.env.WHATSAPP_TO) {
      channels.push({
        type: "whatsapp",
        enabled: true,
        config: {
          accountSid: process.env.TWILIO_ACCOUNT_SID,
          authToken: process.env.TWILIO_AUTH_TOKEN,
          fromNumber: process.env.WHATSAPP_FROM,
          toNumber: process.env.WHATSAPP_TO,
        },
      })
    }

    const title = "New Anonymous Chat Session Started"
    const message = `A new anonymous user has started a chat session.\n\nSession ID: ${sessionId}${initialMessage ? `\n\nFirst message: ${initialMessage.substring(0, 150)}${initialMessage.length > 150 ? "..." : ""}` : ""}`

    await sendMultiChannelNotification({
      title,
      message,
      sessionId,
      priority: "high",
      channels,
    })
  } catch (error) {
    console.error("[v0] Failed to send new session notification:", error)
  }
}
