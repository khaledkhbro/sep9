import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"
    const range = searchParams.get("range") || "7d"

    let dateFilter = ""
    switch (range) {
      case "1d":
        dateFilter = "1 day"
        break
      case "7d":
        dateFilter = "7 days"
        break
      case "30d":
        dateFilter = "30 days"
        break
      case "90d":
        dateFilter = "90 days"
        break
      default:
        dateFilter = "7 days"
    }

    let query = supabaseAdmin
      .from("payment_transactions")
      .select(`
        id,
        gateway_name,
        amount,
        currency_code,
        status,
        transaction_type,
        reference_id,
        created_at,
        users!inner(email)
      `)
      .gte("created_at", `now() - interval '${dateFilter}'`)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (status !== "all") {
      query = query.eq("status", status)
    }

    if (search) {
      query = query.or(`users.email.ilike.%${search}%,reference_id.ilike.%${search}%`)
    }

    const { data: transactions, error } = await query

    if (error) {
      throw error
    }

    // Transform data to match expected format
    const formattedTransactions =
      transactions?.map((t) => ({
        id: t.id,
        gateway: t.gateway_name,
        amount: t.amount,
        currency: t.currency_code,
        status: t.status,
        type: t.transaction_type,
        user_email: t.users?.email,
        created_at: t.created_at,
        reference_id: t.reference_id,
      })) || []

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch transactions",
      },
      { status: 500 },
    )
  }
}
