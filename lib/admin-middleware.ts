import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export type AdminRole = "super_admin" | "manager" | "support"

export interface AdminUser {
  id: number
  username: string
  email: string
  role: AdminRole
  created_at: string
}

export interface AdminPagePermission {
  page: string
  name: string
  description: string
  category: string
}

export const ADMIN_PAGES: AdminPagePermission[] = [
  { page: "/admin", name: "Dashboard", description: "View admin dashboard and overview", category: "Core" },
  { page: "/admin/users", name: "User Management", description: "Manage platform users", category: "User Management" },
  {
    page: "/admin/jobs",
    name: "Job Management",
    description: "Manage jobs and listings",
    category: "Content Management",
  },
  {
    page: "/admin/services",
    name: "Service Management",
    description: "Manage services and offerings",
    category: "Content Management",
  },
  {
    page: "/admin/orders",
    name: "Order Management",
    description: "View and manage orders",
    category: "Transaction Management",
  },
  {
    page: "/admin/categories",
    name: "Category Management",
    description: "Manage job categories",
    category: "Content Management",
  },
  {
    page: "/admin/marketplace-categories",
    name: "Marketplace Categories",
    description: "Manage marketplace categories",
    category: "Content Management",
  },
  {
    page: "/admin/transactions",
    name: "Transaction Management",
    description: "View and manage transactions",
    category: "Transaction Management",
  },
  { page: "/admin/disputes", name: "Dispute Management", description: "Handle user disputes", category: "Support" },
  {
    page: "/admin/support-management",
    name: "Support Management",
    description: "Manage support tickets",
    category: "Support",
  },
  {
    page: "/admin/chat-management",
    name: "Chat Management",
    description: "Monitor and manage chats",
    category: "Support",
  },
  {
    page: "/admin/wallet-management",
    name: "Wallet Management",
    description: "Manage user wallets",
    category: "Financial",
  },
  {
    page: "/admin/payment-methods",
    name: "Payment Methods",
    description: "Configure payment methods",
    category: "Financial",
  },
  {
    page: "/admin/referral-management",
    name: "Referral Management",
    description: "Manage referral system",
    category: "Marketing",
  },
  {
    page: "/admin/roles",
    name: "Role Management",
    description: "Manage admin roles and permissions",
    category: "System",
  },
  { page: "/admin/settings", name: "System Settings", description: "Configure system settings", category: "System" },
]

export function authorizeAdmin(requiredRole: AdminRole | AdminRole[]) {
  return async (req: NextRequest) => {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get(name: string) {
              return req.cookies.get(name)?.value
            },
          },
        },
      )

      // Get admin session from cookies or headers
      const adminToken = req.cookies.get("admin_token")?.value
      if (!adminToken) {
        return NextResponse.json({ error: "Admin authentication required" }, { status: 401 })
      }

      // Verify admin and get role
      const { data: admin, error } = await supabase
        .from("admins")
        .select("id, username, email, role")
        .eq("id", adminToken) // Assuming token contains admin ID
        .single()

      if (error || !admin) {
        return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 })
      }

      // Check role authorization
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      const hasPermission = allowedRoles.includes(admin.role as AdminRole)

      if (!hasPermission) {
        // Log unauthorized access attempt
        await supabase.from("admin_activity_log").insert({
          admin_id: admin.id,
          action: "unauthorized_access_attempt",
          details: {
            required_role: requiredRole,
            user_role: admin.role,
            endpoint: req.url,
          },
          ip_address: req.ip || req.headers.get("x-forwarded-for"),
          user_agent: req.headers.get("user-agent"),
        })

        return NextResponse.json(
          {
            error: "Insufficient permissions",
            required: requiredRole,
            current: admin.role,
          },
          { status: 403 },
        )
      }

      // Log successful access
      await supabase.from("admin_activity_log").insert({
        admin_id: admin.id,
        action: "api_access",
        details: { endpoint: req.url, method: req.method },
        ip_address: req.ip || req.headers.get("x-forwarded-for"),
        user_agent: req.headers.get("user-agent"),
      })

      // Add admin info to request headers for downstream use
      const response = NextResponse.next()
      response.headers.set("x-admin-id", admin.id.toString())
      response.headers.set("x-admin-role", admin.role)
      response.headers.set("x-admin-username", admin.username)

      return response
    } catch (error) {
      console.error("Admin authorization error:", error)
      return NextResponse.json({ error: "Authorization failed" }, { status: 500 })
    }
  }
}

export async function hasPermission(adminId: number, permission: string): Promise<boolean> {
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {},
  })

  const { data: admin } = await supabase.from("admins").select("role").eq("id", adminId).single()

  if (!admin) return false

  const { data: permissions } = await supabase.from("admin_permissions").select("permission").eq("role", admin.role)

  return permissions?.some((p) => p.permission === permission) || false
}

export function getRoleLevel(role: AdminRole): number {
  const levels = {
    support: 1,
    manager: 2,
    super_admin: 3,
  }
  return levels[role] || 0
}

export function canManageRole(managerRole: AdminRole, targetRole: AdminRole): boolean {
  return getRoleLevel(managerRole) > getRoleLevel(targetRole)
}

export async function checkPagePermission(adminId: number, pagePath: string): Promise<boolean> {
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {},
  })

  // Get admin role
  const { data: admin } = await supabase
    .from("admins")
    .select("id, username, email, role_id, custom_roles(name)")
    .eq("id", adminId)
    .single()

  if (!admin) return false

  // Super admin has access to everything
  if (admin.custom_roles?.name === "super_admin") return true

  // Check if role has permission for this page
  const { data: permission } = await supabase
    .from("role_permissions")
    .select("*")
    .eq("role_id", admin.role_id)
    .eq("permission_key", `page_access_${pagePath.replace("/admin/", "").replace("/", "_")}`)
    .single()

  return !!permission
}

export function authorizeAdminPage(pagePath: string) {
  return async (req: NextRequest) => {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get(name: string) {
              return req.cookies.get(name)?.value
            },
          },
        },
      )

      // Get admin session
      const adminToken = req.cookies.get("admin_token")?.value
      if (!adminToken) {
        return NextResponse.json({ error: "Admin authentication required" }, { status: 401 })
      }

      // Verify admin
      const { data: admin, error } = await supabase
        .from("admins")
        .select("id, username, email, role_id, custom_roles(name)")
        .eq("id", adminToken)
        .single()

      if (error || !admin) {
        return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 })
      }

      // Check page permission
      const hasAccess = await checkPagePermission(admin.id, pagePath)

      if (!hasAccess) {
        // Log unauthorized access attempt
        await supabase.from("admin_activity_log").insert({
          admin_id: admin.id,
          action: "unauthorized_page_access",
          details: {
            page: pagePath,
            role: admin.custom_roles?.name,
          },
          ip_address: req.ip || req.headers.get("x-forwarded-for"),
          user_agent: req.headers.get("user-agent"),
        })

        return NextResponse.json({ error: "Access denied to this page" }, { status: 403 })
      }

      // Log successful access
      await supabase.from("admin_activity_log").insert({
        admin_id: admin.id,
        action: "page_access",
        details: { page: pagePath },
        ip_address: req.ip || req.headers.get("x-forwarded-for"),
        user_agent: req.headers.get("user-agent"),
      })

      return NextResponse.next()
    } catch (error) {
      console.error("Page authorization error:", error)
      return NextResponse.json({ error: "Authorization failed" }, { status: 500 })
    }
  }
}
