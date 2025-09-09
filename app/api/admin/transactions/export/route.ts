import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "7d"

    let daysBack = 7
    switch (range) {
      case "1d":
        daysBack = 1
        break
      case "7d":
        daysBack = 7
        break
      case "30d":
        daysBack = 30
        break
      case "90d":
        daysBack = 90
        break
      default:
        daysBack = 7
    }

    const dateFilter = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()

    const { data: transactions, error } = await supabase
      .from("payment_transactions")
      .select(`
        reference_id,
        gateway_name,
        amount,
        currency_code,
        status,
        transaction_type,
        created_at,
        completed_at,
        users!left(email)
      `)
      .gte("created_at", dateFilter)
      .order("created_at", { ascending: false })

    if (error) throw error

    const csvHeader = "Reference ID,Gateway,User Email,Amount,Currency,Status,Type,Created At,Completed At\n"
    const csvRows = (transactions || [])
      .map(
        (t: any) =>
          `"${t.reference_id}","${t.gateway_name}","${t.users?.email || ""}","${t.amount}","${t.currency_code}","${t.status}","${t.transaction_type}","${t.created_at}","${t.completed_at || ""}"`,
      )
      .join("\n")

    const csvContent = csvHeader + csvRows

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="transactions-${range}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting transactions:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to export transactions",
      },
      { status: 500 },
    )
  }
}
