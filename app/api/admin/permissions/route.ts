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

    const { data: permissions, error } = await supabase
      .from("admin_permissions")
      .select("*")
      .order("category", { ascending: true })
      .order("display_name", { ascending: true })

    if (error) throw error

    return NextResponse.json(permissions || [])
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return NextResponse.json({ message: "Failed to fetch permissions" }, { status: 500 })
  }
}
