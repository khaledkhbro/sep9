import { type NextRequest, NextResponse } from "next/server"
import { WebhookProcessor } from "@/lib/webhook-processor"

export async function POST(request: NextRequest, { params }: { params: { gateway: string } }) {
  const processor = new WebhookProcessor()

  try {
    const gateway_name = params.gateway
    const body = await request.json()
    const headers = Object.fromEntries(request.headers.entries())
    const rawBody = await request.text() // For signature verification

    console.log(`[v0] 🔔 WEBHOOK: Received ${gateway_name} webhook:`, body)

    const result = await processor.processWebhook({
      gateway_name,
      event_type: body.event_type || body.type || body.status || "unknown",
      event_id: body.event_id || body.id || body.transaction_id || `${Date.now()}`,
      transaction_id: body.order_id || body.transaction_id || body.merchant_order_id,
      payload: body,
      headers,
      raw_body: rawBody,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    })

    if (result.success) {
      console.log(`[v0] ✅ WEBHOOK: Successfully processed ${gateway_name} webhook`)
      return NextResponse.json({
        success: true,
        message: "Webhook processed successfully",
        webhook_id: result.webhook_id,
      })
    } else {
      console.warn(`[v0] ⚠️ WEBHOOK: Failed to process ${gateway_name} webhook:`, result.error)
      return NextResponse.json(
        {
          error: result.error || "Failed to process webhook",
          webhook_id: result.webhook_id,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error(`[v0] ❌ WEBHOOK: Error processing ${params.gateway} webhook:`, error)

    await processor.logFailedWebhook({
      gateway_name: params.gateway,
      error: error instanceof Error ? error.message : "Unknown error",
      headers: Object.fromEntries(request.headers.entries()),
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json(
      {
        error: "Webhook processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: { gateway: string } }) {
  try {
    const gateway_name = params.gateway
    const processor = new WebhookProcessor()

    const health = await processor.getWebhookHealth(gateway_name)

    return NextResponse.json({
      gateway: gateway_name,
      status: "healthy",
      ...health,
    })
  } catch (error) {
    return NextResponse.json(
      {
        gateway: params.gateway,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
