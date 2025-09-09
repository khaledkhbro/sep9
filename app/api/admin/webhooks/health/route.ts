import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { data: webhookHealth, error } = await supabase.rpc("get_webhook_health_stats")

    if (error) throw error

    return NextResponse.json({
      success: true,
      health: (webhookHealth || []).map((h: any) => ({
        gateway: h.gateway,
        last_success: h.last_success,
        success_rate: Number.parseFloat(h.success_rate) || 0,
        avg_response_time: Math.round(Number.parseFloat(h.avg_response_time) || 0),
        status: h.status,
      })),
    })
  } catch (error) {
    console.error("Error fetching webhook health:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch webhook health",
      },
      { status: 500 },
    )
  }
}
