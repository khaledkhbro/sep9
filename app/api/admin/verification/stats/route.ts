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

    // Get verification request stats
    const { data: requestStats, error: requestError } = await supabase.from("verification_requests").select("status")

    if (requestError) {
      console.error("Error fetching request stats:", requestError)
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }

    // Get verified users count
    const { data: verifiedUsers, error: usersError } = await supabase
      .from("user_verification_status")
      .select("id")
      .eq("is_verified", true)

    if (usersError) {
      console.error("Error fetching verified users:", usersError)
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }

    const stats = {
      total_requests: requestStats?.length || 0,
      pending_requests: requestStats?.filter((r) => r.status === "pending").length || 0,
      approved_requests: requestStats?.filter((r) => r.status === "approved").length || 0,
      rejected_requests: requestStats?.filter((r) => r.status === "rejected").length || 0,
      verified_users: verifiedUsers?.length || 0,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error in verification stats API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
