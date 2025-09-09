import { type NextRequest, NextResponse } from "next/server"
import { authorizeAdmin, canManageRole, type AdminRole } from "@/lib/admin-middleware"
import { createServerClient } from "@supabase/ssr"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const authResult = await authorizeAdmin("super_admin")(req)
  if (authResult.status !== 200) return authResult

  try {
    const { username, email, password, role } = await req.json()
    const creatorRole = req.headers.get("x-admin-role") as AdminRole
    const creatorId = req.headers.get("x-admin-id")

    // Validate that creator can manage the target role
    if (!canManageRole(creatorRole, role as AdminRole)) {
      return NextResponse.json(
        {
          error: "Cannot create admin with higher or equal privileges",
        },
        { status: 403 },
      )
    }

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {},
    })

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create new admin
    const { data: newAdmin, error } = await supabase
      .from("admins")
      .insert({
        username,
        email,
        password: hashedPassword,
        role,
      })
      .select()
      .single()

    if (error) throw error

    // Log admin creation
    await supabase.from("admin_activity_log").insert({
      admin_id: Number.parseInt(creatorId!),
      action: "admin_created",
      details: {
        new_admin_id: newAdmin.id,
        new_admin_username: username,
        new_admin_role: role,
      },
    })

    return NextResponse.json({
      message: "Admin created successfully",
      admin: { id: newAdmin.id, username, email, role },
    })
  } catch (error) {
    console.error("Error creating admin:", error)
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 })
  }
}
