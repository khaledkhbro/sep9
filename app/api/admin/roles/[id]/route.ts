import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { displayName, description, color, permissions } = await request.json()
    const roleId = params.id

    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const { error: roleError } = await supabase
      .from("admin_roles")
      .update({
        display_name: displayName,
        description,
        color,
        updated_at: new Date().toISOString(),
      })
      .eq("id", roleId)

    if (roleError) throw roleError

    // First, delete existing permissions
    const { error: deleteError } = await supabase.from("admin_role_permissions").delete().eq("role_id", roleId)

    if (deleteError) throw deleteError

    // Then, insert new permissions
    if (permissions && permissions.length > 0) {
      const rolePermissions = permissions.map((permissionId: string) => ({
        role_id: roleId,
        permission_id: permissionId,
      }))

      const { error: insertError } = await supabase.from("admin_role_permissions").insert(rolePermissions)

      if (insertError) throw insertError
    }

    return NextResponse.json({ message: "Role updated successfully" })
  } catch (error) {
    console.error("Error updating role:", error)
    return NextResponse.json({ message: "Failed to update role" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const roleId = params.id

    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const { data: role, error: fetchError } = await supabase
      .from("admin_roles")
      .select("is_system_role, name")
      .eq("id", roleId)
      .single()

    if (fetchError) throw fetchError

    if (role.is_system_role) {
      return NextResponse.json({ message: "Cannot delete system roles" }, { status: 400 })
    }

    const { data: users, error: usersError } = await supabase.from("users").select("id").eq("admin_role_id", roleId)

    if (usersError) throw usersError

    if (users && users.length > 0) {
      return NextResponse.json(
        {
          message: "Cannot delete role with assigned users. Please reassign users first.",
        },
        { status: 400 },
      )
    }

    const { error: deleteError } = await supabase.from("admin_roles").delete().eq("id", roleId)

    if (deleteError) throw deleteError

    return NextResponse.json({ message: "Role deleted successfully" })
  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json({ message: "Failed to delete role" }, { status: 500 })
  }
}
