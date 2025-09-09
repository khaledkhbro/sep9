// Enhanced Webhook Processing System with retry mechanism and monitoring
import { createServerClient } from "@/lib/supabase/server"
import { paymentService } from "@/lib/payment-service"
import { createNotification } from "@/lib/notifications"

export interface EnhancedWebhookEvent {
  gateway_name: string
  event_type: string
  event_id: string
  transaction_id?: string
  payload: Record<string, any>
  headers: Record<string, string>
  raw_body?: string
  ip_address: string
  user_agent: string
}

export interface WebhookProcessingResult {
  success: boolean
  webhook_id?: string
  error?: string
  retry_scheduled?: boolean
}

export interface WebhookHealth {
  total_webhooks: number
  successful_webhooks: number
  failed_webhooks: number
  success_rate: number
  last_webhook_at?: string
  average_processing_time?: number
}

export class WebhookProcessor {
  private supabase = createServerClient()
  private maxRetries = 3
  private retryDelays = [60, 300, 900] // 1min, 5min, 15min

  async processWebhook(webhook: EnhancedWebhookEvent): Promise<WebhookProcessingResult> {
    const startTime = Date.now()

    try {
      // Check for duplicate webhooks
      const isDuplicate = await this.checkDuplicateWebhook(webhook.gateway_name, webhook.event_id)
      if (isDuplicate) {
        console.log(`[v0] 🔄 WEBHOOK: Duplicate webhook ignored: ${webhook.event_id}`)
        return { success: true, error: "Duplicate webhook ignored" }
      }

      // Validate webhook source IP (optional security measure)
      const isValidSource = await this.validateWebhookSource(webhook.gateway_name, webhook.ip_address)
      if (!isValidSource) {
        console.warn(`[v0] 🚫 WEBHOOK: Invalid source IP: ${webhook.ip_address}`)
        return { success: false, error: "Invalid webhook source" }
      }

      // Log webhook event
      const { data: webhookRecord, error: logError } = await this.supabase
        .from("webhook_events")
        .insert({
          payment_gateway_id: await this.getGatewayId(webhook.gateway_name),
          event_type: webhook.event_type,
          event_id: webhook.event_id,
          transaction_id: webhook.transaction_id ? await this.getTransactionId(webhook.transaction_id) : null,
          payload: webhook.payload,
          headers: webhook.headers,
          ip_address: webhook.ip_address,
          user_agent: webhook.user_agent,
          processed: false,
          retry_count: 0,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (logError) {
        console.error("[v0] ❌ WEBHOOK: Failed to log webhook:", logError)
        return { success: false, error: "Failed to log webhook event" }
      }

      // Process webhook using payment service
      const processed = await paymentService.processWebhook({
        gateway_name: webhook.gateway_name,
        event_type: webhook.event_type,
        event_id: webhook.event_id,
        transaction_id: webhook.transaction_id,
        payload: webhook.payload,
        headers: webhook.headers,
      })

      const processingTime = Date.now() - startTime

      // Update webhook processing status
      await this.supabase
        .from("webhook_events")
        .update({
          processed,
          processed_at: new Date().toISOString(),
          processing_time_ms: processingTime,
          error_message: processed ? null : "Processing failed - will retry",
        })
        .eq("id", webhookRecord.id)

      if (processed) {
        // Send success notification to admin
        await this.notifyWebhookSuccess(webhook, processingTime)
        return { success: true, webhook_id: webhookRecord.id }
      } else {
        // Schedule retry
        await this.scheduleWebhookRetry(webhookRecord.id, webhook)
        return {
          success: false,
          webhook_id: webhookRecord.id,
          error: "Processing failed - retry scheduled",
          retry_scheduled: true,
        }
      }
    } catch (error) {
      console.error("[v0] ❌ WEBHOOK: Processing error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown processing error",
      }
    }
  }

  async retryFailedWebhook(webhookId: string): Promise<boolean> {
    try {
      const { data: webhook, error } = await this.supabase
        .from("webhook_events")
        .select("*")
        .eq("id", webhookId)
        .single()

      if (error || !webhook) {
        console.error("[v0] ❌ WEBHOOK: Webhook not found for retry:", webhookId)
        return false
      }

      if (webhook.retry_count >= this.maxRetries) {
        console.log("[v0] 🚫 WEBHOOK: Max retries exceeded:", webhookId)
        await this.markWebhookFailed(webhookId, "Max retries exceeded")
        return false
      }

      // Increment retry count
      await this.supabase
        .from("webhook_events")
        .update({
          retry_count: webhook.retry_count + 1,
          last_retry_at: new Date().toISOString(),
        })
        .eq("id", webhookId)

      // Process webhook again
      const processed = await paymentService.processWebhook({
        gateway_name: webhook.gateway_name,
        event_type: webhook.event_type,
        event_id: webhook.event_id,
        transaction_id: webhook.transaction_id,
        payload: webhook.payload,
        headers: webhook.headers,
      })

      if (processed) {
        await this.supabase
          .from("webhook_events")
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
            error_message: null,
          })
          .eq("id", webhookId)

        console.log(`[v0] ✅ WEBHOOK: Retry successful for webhook: ${webhookId}`)
        return true
      } else {
        // Schedule next retry if not at max
        if (webhook.retry_count + 1 < this.maxRetries) {
          await this.scheduleWebhookRetry(webhookId, webhook, webhook.retry_count + 1)
        } else {
          await this.markWebhookFailed(webhookId, "All retries failed")
        }
        return false
      }
    } catch (error) {
      console.error("[v0] ❌ WEBHOOK: Retry error:", error)
      return false
    }
  }

  async getWebhookHealth(gateway_name: string): Promise<WebhookHealth> {
    try {
      const { data: stats } = await this.supabase
        .from("webhook_events")
        .select("processed, created_at, processing_time_ms")
        .eq("payment_gateway_id", await this.getGatewayId(gateway_name))
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

      if (!stats || stats.length === 0) {
        return {
          total_webhooks: 0,
          successful_webhooks: 0,
          failed_webhooks: 0,
          success_rate: 0,
        }
      }

      const total = stats.length
      const successful = stats.filter((s) => s.processed).length
      const failed = total - successful
      const successRate = (successful / total) * 100

      const processingTimes = stats.filter((s) => s.processing_time_ms).map((s) => s.processing_time_ms)

      const avgProcessingTime =
        processingTimes.length > 0 ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length : 0

      return {
        total_webhooks: total,
        successful_webhooks: successful,
        failed_webhooks: failed,
        success_rate: Math.round(successRate * 100) / 100,
        last_webhook_at: stats[0]?.created_at,
        average_processing_time: Math.round(avgProcessingTime),
      }
    } catch (error) {
      console.error("[v0] ❌ WEBHOOK: Health check error:", error)
      throw error
    }
  }

  async logFailedWebhook(data: {
    gateway_name: string
    error: string
    headers: Record<string, string>
    ip_address: string
  }): Promise<void> {
    try {
      await this.supabase.from("webhook_events").insert({
        payment_gateway_id: await this.getGatewayId(data.gateway_name),
        event_type: "processing_error",
        event_id: `error_${Date.now()}`,
        payload: { error: data.error },
        headers: data.headers,
        ip_address: data.ip_address,
        processed: false,
        error_message: data.error,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("[v0] ❌ WEBHOOK: Failed to log error:", error)
    }
  }

  private async checkDuplicateWebhook(gateway_name: string, event_id: string): Promise<boolean> {
    const { data } = await this.supabase
      .from("webhook_events")
      .select("id")
      .eq("payment_gateway_id", await this.getGatewayId(gateway_name))
      .eq("event_id", event_id)
      .limit(1)

    return data && data.length > 0
  }

  private async validateWebhookSource(gateway_name: string, ip_address: string): Promise<boolean> {
    // Implement IP whitelist validation for each gateway
    const allowedIPs = await this.getAllowedIPs(gateway_name)

    if (allowedIPs.length === 0) {
      return true // No IP restrictions configured
    }

    return allowedIPs.includes(ip_address)
  }

  private async getAllowedIPs(gateway_name: string): Promise<string[]> {
    // Gateway-specific IP whitelists
    const ipWhitelists: Record<string, string[]> = {
      portwallet: ["103.106.118.10", "103.106.118.11"],
      aamarpay: ["103.239.252.1", "103.239.252.2"],
      coingate: ["54.93.114.135", "54.93.114.136"],
      nowpayments: ["54.36.126.26", "54.36.126.27"],
      // Add other gateway IPs as needed
    }

    return ipWhitelists[gateway_name] || []
  }

  private async scheduleWebhookRetry(webhookId: string, webhook: any, retryCount = 0): Promise<void> {
    if (retryCount >= this.maxRetries) {
      await this.markWebhookFailed(webhookId, "Max retries exceeded")
      return
    }

    const delay = this.retryDelays[retryCount] || 900 // Default 15 minutes
    const retryAt = new Date(Date.now() + delay * 1000)

    // In a production environment, you would use a job queue like Bull or Agenda
    // For now, we'll use a simple setTimeout (not recommended for production)
    setTimeout(async () => {
      await this.retryFailedWebhook(webhookId)
    }, delay * 1000)

    console.log(`[v0] ⏰ WEBHOOK: Retry scheduled for ${webhookId} in ${delay} seconds`)
  }

  private async markWebhookFailed(webhookId: string, reason: string): Promise<void> {
    await this.supabase
      .from("webhook_events")
      .update({
        processed: false,
        error_message: reason,
        final_failure_at: new Date().toISOString(),
      })
      .eq("id", webhookId)

    // Notify admin of permanent failure
    await this.notifyWebhookFailure(webhookId, reason)
  }

  private async notifyWebhookSuccess(webhook: EnhancedWebhookEvent, processingTime: number): Promise<void> {
    // Only notify for important events or slow processing
    if (processingTime > 5000 || webhook.event_type.includes("completed")) {
      try {
        await createNotification({
          userId: "admin", // Admin user ID
          type: "system",
          title: `Webhook Processed: ${webhook.gateway_name}`,
          description: `${webhook.event_type} processed in ${processingTime}ms`,
          actionUrl: `/admin/webhooks/${webhook.event_id}`,
        })
      } catch (error) {
        console.error("[v0] ❌ WEBHOOK: Failed to send success notification:", error)
      }
    }
  }

  private async notifyWebhookFailure(webhookId: string, reason: string): Promise<void> {
    try {
      await createNotification({
        userId: "admin", // Admin user ID
        type: "error",
        title: "Webhook Processing Failed",
        description: `Webhook ${webhookId} failed permanently: ${reason}`,
        actionUrl: `/admin/webhooks/${webhookId}`,
      })
    } catch (error) {
      console.error("[v0] ❌ WEBHOOK: Failed to send failure notification:", error)
    }
  }

  private async getGatewayId(gateway_name: string): Promise<number> {
    const { data } = await this.supabase.from("payment_gateways").select("id").eq("name", gateway_name).single()

    return data?.id || 0
  }

  private async getTransactionId(external_transaction_id: string): Promise<number | null> {
    const { data } = await this.supabase
      .from("transactions")
      .select("id")
      .eq("transaction_id", external_transaction_id)
      .single()

    return data?.id || null
  }
}
