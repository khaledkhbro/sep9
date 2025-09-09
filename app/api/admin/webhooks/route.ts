// Admin API for webhook monitoring and management
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { WebhookProcessor } from "@/lib/webhook-processor"

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const gateway = searchParams.get("gateway")
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const supabase = createServerClient()

    let query = supabase
      .from("webhook_events")
      .select(`
        *,
        payment_gateways(name, display_name),
        transactions(transaction_id, amount, status)
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (gateway) {
      const { data: gatewayData } = await supabase.from("payment_gateways").select("id").eq("name", gateway).single()

      if (gatewayData) {
        query = query.eq("payment_gateway_id", gatewayData.id)
      }
    }

    if (status === "processed") {
      query = query.eq("processed", true)
    } else if (status === "failed") {
      query = query.eq("processed", false)
    }

    const { data: webhooks, error } = await query

    if (error) {
      console.error("Error fetching webhooks:", error)
      return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 })
    }

    // Get summary statistics
    const processor = new WebhookProcessor()
    const healthPromises = ["portwallet", "aamarpay", "coingate", "nowpayments"].map(async (gw) => {
      try {
        const health = await processor.getWebhookHealth(gw)
        return { gateway: gw, ...health }
      } catch {
        return { gateway: gw, total_webhooks: 0, successful_webhooks: 0, failed_webhooks: 0, success_rate: 0 }
      }
    })

    const healthStats = await Promise.all(healthPromises)

    return NextResponse.json({
      success: true,
      webhooks,
      health_stats: healthStats,
      pagination: {
        limit,
        offset,
        total: webhooks?.length || 0,
      },
    })
  } catch (error) {
    console.error("Error in webhooks API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, webhook_id } = await request.json()

    if (action === "retry" && webhook_id) {
      const processor = new WebhookProcessor()
      const success = await processor.retryFailedWebhook(webhook_id)

      return NextResponse.json({
        success,
        message: success ? "Webhook retry initiated" : "Webhook retry failed",
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in webhooks POST API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
