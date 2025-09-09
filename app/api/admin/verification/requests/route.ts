import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status") || "all"
    const document_type = searchParams.get("document_type") || "all"
    const search = searchParams.get("search") || ""

    let query = supabase.from("verification_requests").select("*").order("created_at", { ascending: false })

    // Apply filters
    if (status !== "all") {
      query = query.eq("status", status)
    }
    if (document_type !== "all") {
      query = query.eq("document_type", document_type)
    }

    // Get total count for pagination
    const { count } = await supabase.from("verification_requests").select("*", { count: "exact", head: true })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: requests, error } = await query

    if (error) {
      console.error("Error fetching verification requests:", error)
      return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 })
    }

    const userIds = [
      ...new Set([
        ...(requests?.map((r) => r.user_id).filter(Boolean) || []),
        ...(requests?.map((r) => r.reviewed_by).filter(Boolean) || []),
      ]),
    ]

    let users = []
    if (userIds.length > 0) {
      const { data: userData } = await supabase.auth.admin.listUsers()
      users = userData?.users || []
    }

    const transformedRequests = requests?.map((request) => {
      const user = users.find((u) => u.id === request.user_id)
      const reviewer = users.find((u) => u.id === request.reviewed_by)

      return {
        ...request,
        user: user
          ? {
              id: user.id,
              email: user.email,
              firstName: user.user_metadata?.firstName || user.user_metadata?.first_name || "",
              lastName: user.user_metadata?.lastName || user.user_metadata?.last_name || "",
              phone: user.user_metadata?.phone || "",
            }
          : null,
        reviewer: reviewer
          ? {
              id: reviewer.id,
              email: reviewer.email,
              firstName: reviewer.user_metadata?.firstName || reviewer.user_metadata?.first_name || "",
              lastName: reviewer.user_metadata?.lastName || reviewer.user_metadata?.last_name || "",
            }
          : null,
      }
    })

    // Apply search filter on transformed data
    let filteredRequests = transformedRequests
    if (search) {
      filteredRequests = transformedRequests?.filter(
        (request) =>
          request.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
          request.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
          request.user?.lastName?.toLowerCase().includes(search.toLowerCase()),
      )
    }

    return NextResponse.json({
      requests: filteredRequests || [],
      total: count || 0,
      page,
      limit,
    })
  } catch (error) {
    console.error("Error in verification requests API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
