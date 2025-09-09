import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { authorizeAdmin } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Check admin authorization
    const authResult = await authorizeAdmin(request, ["super_admin", "manager"])
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Fetch admin activities
    const { data: activities, error } = await supabase
      .from("admin_activity_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(100)

    if (error) {
      console.error("Error fetching admin activities:", error)
      return NextResponse.json({ error: "Failed to fetch admin activities" }, { status: 500 })
    }

    return NextResponse.json(activities || [])
  } catch (error) {
    console.error("Error in admin activities API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
