import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get("server_id") || "main-server"
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const unreadOnly = searchParams.get("unread") === "true"

    let query = supabase
      .from("monitoring_notifications")
      .select(`
        *,
        monitoring_alerts!inner(
          alert_name,
          alert_type,
          severity
        )
      `)
      .eq("server_id", serverId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.is("resolved_at", null)
    }

    const { data: notifications, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data:
        notifications?.map((notification) => ({
          id: notification.id,
          alertId: notification.alert_id,
          alertName: notification.monitoring_alerts.alert_name,
          alertType: notification.monitoring_alerts.alert_type,
          message: notification.alert_message,
          severity: notification.monitoring_alerts.severity,
          metricValue: Number(notification.metric_value),
          thresholdValue: Number(notification.threshold_value),
          notificationSent: notification.notification_sent,
          notificationMethod: notification.notification_method,
          resolvedAt: notification.resolved_at,
          createdAt: notification.created_at,
        })) || [],
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notification_ids, action } = body

    if (!notification_ids || !Array.isArray(notification_ids)) {
      return NextResponse.json({ error: "notification_ids must be an array" }, { status: 400 })
    }

    const updateData: any = {}

    if (action === "resolve") {
      updateData.resolved_at = new Date().toISOString()
    } else if (action === "mark_sent") {
      updateData.notification_sent = true
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'resolve' or 'mark_sent'" }, { status: 400 })
    }

    const { error } = await supabase.from("monitoring_notifications").update(updateData).in("id", notification_ids)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `Notifications ${action}d successfully`,
    })
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}
