import { type NextRequest, NextResponse } from "next/server"
import { authorizeAdmin } from "@/lib/admin-middleware"
import { createServerClient } from "@supabase/ssr"

export async function GET(req: NextRequest) {
  const authResult = await authorizeAdmin("super_admin")(req)
  if (authResult.status !== 200) return authResult

  try {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {},
    })

    const { data: settings, error } = await supabase.from("admin_settings").select("*")

    if (error) throw error

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authResult = await authorizeAdmin("super_admin")(req)
  if (authResult.status !== 200) return authResult

  try {
    const body = await req.json()
    const adminId = req.headers.get("x-admin-id")

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {},
    })

    // Update settings
    const { error } = await supabase.from("admin_settings").upsert(body)

    if (error) throw error

    // Log the settings change
    await supabase.from("admin_activity_log").insert({
      admin_id: Number.parseInt(adminId!),
      action: "settings_updated",
      details: { updated_settings: Object.keys(body) },
    })

    return NextResponse.json({ message: "Settings updated successfully" })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
