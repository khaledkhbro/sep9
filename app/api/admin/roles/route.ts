import { type NextRequest, NextResponse } from "next/server"
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

    const { data: roles, error } = await supabase
      .from("admin_roles")
      .select(`
        *,
        admin_role_permissions (
          admin_permissions (*)
        )
      `)
      .order("created_at", { ascending: true })

    if (error) throw error

    // Get user counts for each role
    const { data: userCounts } = await supabase.from("users").select("admin_role_id").not("admin_role_id", "is", null)

    const userCountMap =
      userCounts?.reduce(
        (acc, user) => {
          acc[user.admin_role_id] = (acc[user.admin_role_id] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ) || {}

    const formattedRoles =
      roles?.map((role) => ({
        id: role.id,
        name: role.name,
        displayName: role.display_name,
        description: role.description,
        color: role.color,
        isSystemRole: role.is_system_role,
        userCount: userCountMap[role.id] || 0,
        permissions: role.admin_role_permissions?.map((rp: any) => rp.admin_permissions.id) || [],
      })) || []

    return NextResponse.json(formattedRoles)
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ message: "Failed to fetch roles" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, displayName, description, color, permissions } = await request.json()

    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const { data: role, error: roleError } = await supabase
      .from("admin_roles")
      .insert({
        name: name.toLowerCase().replace(/\s+/g, "_"),
        display_name: displayName,
        description,
        color,
        is_system_role: false,
      })
      .select()
      .single()

    if (roleError) throw roleError

    if (permissions && permissions.length > 0) {
      const rolePermissions = permissions.map((permissionId: string) => ({
        role_id: role.id,
        permission_id: permissionId,
      }))

      const { error: permError } = await supabase.from("admin_role_permissions").insert(rolePermissions)

      if (permError) throw permError
    }

    return NextResponse.json({ message: "Role created successfully", role })
  } catch (error) {
    console.error("Error creating role:", error)
    return NextResponse.json({ message: "Failed to create role" }, { status: 500 })
  }
}
