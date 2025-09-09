import { type NextRequest, NextResponse } from "next/server"
import { authorizeAdmin } from "@/lib/admin-middleware"
import { createServerClient } from "@supabase/ssr"

export async function GET(req: NextRequest) {
  // Check authorization first
  const authResult = await authorizeAdmin(["manager", "super_admin"])(req)
  if (authResult.status !== 200) return authResult

  try {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {},
    })

    const { data: users, error } = await supabase
      .from("users")
      .select("id, username, email, created_at, is_active")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
