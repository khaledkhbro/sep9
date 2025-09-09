import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {},
    })

    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get("roleId")

    if (roleId) {
      // Get permissions for specific role
      const { data: permissions, error } = await supabase
        .from("role_permissions")
        .select("permission_key")
        .eq("role_id", roleId)
        .like("permission_key", "page_access_%")

      if (error) throw error

      return NextResponse.json({
        permissions: permissions.map((p) => p.permission_key),
      })
    }

    // Get all page permissions for all roles
    const { data: allPermissions, error } = await supabase
      .from("role_permissions")
      .select("role_id, permission_key")
      .like("permission_key", "page_access_%")

    if (error) throw error

    return NextResponse.json({ permissions: allPermissions })
  } catch (error) {
    console.error("Error fetching page permissions:", error)
    return NextResponse.json({ error: "Failed to fetch page permissions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { roleId, pageKey, granted } = await request.json()

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {},
    })

    const permissionKey = `page_access_${pageKey}`

    if (granted) {
      // Grant permission
      const { error } = await supabase.from("role_permissions").insert({
        role_id: roleId,
        permission_key: permissionKey,
        permission_value: true,
      })

      if (error) throw error
    } else {
      // Revoke permission
      const { error } = await supabase
        .from("role_permissions")
        .delete()
        .eq("role_id", roleId)
        .eq("permission_key", permissionKey)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating page permission:", error)
    return NextResponse.json({ error: "Failed to update page permission" }, { status: 500 })
  }
}
