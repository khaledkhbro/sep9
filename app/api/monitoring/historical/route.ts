import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get("server_id") || "main-server"
    const hours = Number.parseInt(searchParams.get("hours") || "24")
    const interval = searchParams.get("interval") || "1h"

    if (hours < 1 || hours > 168) {
      return NextResponse.json({ error: "Hours must be between 1 and 168" }, { status: 400 })
    }

    let intervalMinutes = 60
    switch (interval) {
      case "5m":
        intervalMinutes = 5
        break
      case "15m":
        intervalMinutes = 15
        break
      case "30m":
        intervalMinutes = 30
        break
      case "1h":
        intervalMinutes = 60
        break
      default:
        intervalMinutes = 60
    }

    const { data: metrics, error } = await supabase.rpc("get_historical_metrics", {
      server_id: serverId,
      hours_back: hours,
      interval_minutes: intervalMinutes,
    })

    if (error) throw error

    const formattedData = (metrics || []).map((row: any) => ({
      timestamp: row.time_bucket,
      cpu: Number(row.cpu_usage?.toFixed(1)) || 0,
      memory: Number(row.memory_usage?.toFixed(1)) || 0,
      disk: Number(row.disk_usage?.toFixed(1)) || 0,
      network: Number(row.network_total?.toFixed(1)) || 0,
    }))

    return NextResponse.json({
      success: true,
      data: formattedData,
      meta: {
        serverId,
        hours,
        interval,
        dataPoints: formattedData.length,
      },
    })
  } catch (error) {
    console.error("Error fetching historical metrics:", error)
    return NextResponse.json({ error: "Failed to fetch historical metrics" }, { status: 500 })
  }
}
