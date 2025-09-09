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

    const { data: settings, error } = await supabase
      .from("verification_settings")
      .select("*")
      .eq("enabled", true)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching verification settings:", error)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error in user verification settings API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
