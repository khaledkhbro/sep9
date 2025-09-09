import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const { id } = params

    // Get current user (admin) from auth
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update verification request
    const { data, error } = await supabase
      .from("verification_requests")
      .update({
        status: "approved",
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error approving verification request:", error)
      return NextResponse.json({ error: "Failed to approve request" }, { status: 500 })
    }

    return NextResponse.json({ request: data })
  } catch (error) {
    console.error("Error in verification approve API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
