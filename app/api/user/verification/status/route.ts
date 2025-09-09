import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: status, error } = await supabase
      .from("user_verification_status")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error
      console.error("Error fetching user verification status:", error)
      return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 })
    }

    return NextResponse.json({
      status: status || {
        is_verified: false,
        verification_level: "none",
      },
    })
  } catch (error) {
    console.error("Error in user verification status API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
