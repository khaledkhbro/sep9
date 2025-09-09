import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const { data: fraudAlerts, error } = await supabase
      .from("payment_transactions")
      .select(`
        id,
        gateway_name,
        amount,
        created_at,
        status,
        users!left(email)
      `)
      .gt("amount", 1000)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .in("status", ["pending", "processing"])
      .order("amount", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error

    const formattedAlerts = (fraudAlerts || []).map((alert: any) => ({
      id: alert.id,
      type: "suspicious_amount",
      gateway: alert.gateway_name,
      user_email: alert.users?.email,
      amount: alert.amount,
      risk_score: alert.amount > 10000 ? 95 : alert.amount > 5000 ? 80 : alert.amount > 1000 ? 60 : 30,
      created_at: alert.created_at,
    }))

    return NextResponse.json({
      success: true,
      alerts: formattedAlerts,
    })
  } catch (error) {
    console.error("Error fetching fraud alerts:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch fraud alerts",
      },
      { status: 500 },
    )
  }
}
