import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get("server_id") || "main-server"

    const { data: status, error } = await supabase.rpc("get_server_status", {
      server_id: serverId,
    })

    if (error) throw error

    if (!status || status.length === 0) {
      return NextResponse.json({ error: "No status found for server" }, { status: 404 })
    }

    const serverStatus = status[0]

    return NextResponse.json({
      success: true,
      data: {
        database: {
          status: serverStatus.database_status,
          connections: {
            active: serverStatus.db_connections_active,
            max: serverStatus.db_connections_max,
          },
          size: Number(serverStatus.db_size_gb),
          version: serverStatus.db_version,
        },
        application: {
          status: serverStatus.application_status,
          activeUsers: serverStatus.active_users,
          responseTime: serverStatus.response_time_ms,
          errorRate: Number(serverStatus.error_rate_percent),
          requestsPerMinute: serverStatus.requests_per_minute,
        },
        webServer: {
          status: serverStatus.web_server_status,
        },
        lastUpdated: serverStatus.last_updated,
      },
    })
  } catch (error) {
    console.error("Error fetching server status:", error)
    return NextResponse.json({ error: "Failed to fetch server status" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      server_id = "main-server",
      database_status = "unknown",
      web_server_status = "unknown",
      application_status = "unknown",
      db_connections_active = 0,
      db_connections_max = 100,
      db_size_gb = 0,
      db_version = null,
      active_users = 0,
      response_time_ms = 0,
      error_rate_percent = 0,
      requests_per_minute = 0,
    } = body

    const { data: result, error } = await supabase
      .from("server_status")
      .insert({
        server_id,
        database_status,
        web_server_status,
        application_status,
        db_connections_active,
        db_connections_max,
        db_size_gb,
        db_version,
        active_users,
        response_time_ms,
        error_rate_percent,
        requests_per_minute,
      })
      .select("id")
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: { id: result.id },
    })
  } catch (error) {
    console.error("Error inserting server status:", error)
    return NextResponse.json({ error: "Failed to insert server status" }, { status: 500 })
  }
}
