import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get("active") === "true"

    let query = supabase.from("monitoring_alerts").select(`
        *,
        monitoring_notifications!left(count)
      `)

    if (activeOnly) {
      query = query.eq("is_enabled", true)
    }

    const { data: alerts, error } = await query.order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: (alerts || []).map((alert: any) => ({
        id: alert.id,
        name: alert.alert_name,
        type: alert.alert_type,
        threshold: {
          value: Number(alert.threshold_value),
          operator: alert.threshold_operator,
        },
        severity: alert.severity,
        isEnabled: alert.is_enabled,
        notifications: {
          email: alert.notification_email,
          webhook: alert.notification_webhook,
        },
        cooldownMinutes: alert.cooldown_minutes,
        stats: {
          triggerCount: alert.trigger_count,
          lastTriggered: alert.last_triggered_at,
          notificationCount: alert.monitoring_notifications?.length || 0,
        },
        createdAt: alert.created_at,
        updatedAt: alert.updated_at,
      })),
    })
  } catch (error) {
    console.error("Error fetching monitoring alerts:", error)
    return NextResponse.json({ error: "Failed to fetch monitoring alerts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      alert_name,
      alert_type,
      threshold_value,
      threshold_operator,
      severity = "warning",
      notification_email,
      notification_webhook,
      cooldown_minutes = 15,
      is_enabled = true,
    } = body

    if (!alert_name || !alert_type || !threshold_value || !threshold_operator) {
      return NextResponse.json({ error: "Missing required alert fields" }, { status: 400 })
    }

    const validTypes = ["cpu", "memory", "disk", "network", "service"]
    if (!validTypes.includes(alert_type)) {
      return NextResponse.json({ error: "Invalid alert type" }, { status: 400 })
    }

    const validOperators = [">", ">=", "<", "<=", "="]
    if (!validOperators.includes(threshold_operator)) {
      return NextResponse.json({ error: "Invalid threshold operator" }, { status: 400 })
    }

    const { data: result, error } = await supabase
      .from("monitoring_alerts")
      .insert({
        alert_name,
        alert_type,
        threshold_value,
        threshold_operator,
        severity,
        notification_email,
        notification_webhook,
        cooldown_minutes,
        is_enabled,
      })
      .select("id")
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: { id: result.id },
    })
  } catch (error) {
    console.error("Error creating monitoring alert:", error)
    return NextResponse.json({ error: "Failed to create monitoring alert" }, { status: 500 })
  }
}
