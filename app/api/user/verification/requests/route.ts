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

    const { data: requests, error } = await supabase
      .from("verification_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user verification requests:", error)
      return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 })
    }

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Error in user verification requests API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
