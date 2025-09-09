import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { authorizeAdmin, logAdminActivity } from "@/lib/admin-auth"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Check admin authorization - only super admins can update roles
    const authResult = await authorizeAdmin(request, ["super_admin"])
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json({ error: "User ID and role are required" }, { status: 400 })
    }

    if (!["super_admin", "manager", "support"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Get current user info for logging
    const { data: currentUser } = await supabase
      .from("users")
      .select("email, firstName, lastName")
      .eq("id", userId)
      .single()

    // Update user role
    const { error: updateError } = await supabase.from("users").update({ role }).eq("id", userId)

    if (updateError) {
      console.error("Error updating user role:", updateError)
      return NextResponse.json({ error: "Failed to update user role" }, { status: 500 })
    }

    // Log the activity
    await logAdminActivity(
      supabase,
      authResult.user.id,
      authResult.user.email,
      "UPDATE_ADMIN_ROLE",
      "user",
      userId,
      `Changed role to ${role} for ${currentUser?.email}`,
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in update role API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
