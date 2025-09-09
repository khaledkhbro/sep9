import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { transactionId: string } }) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerClient()

    const { data: transaction, error } = await supabase
      .from("transactions")
      .select(`
        *,
        payment_gateways(name, display_name, type),
        currencies(code, symbol),
        escrow_transactions(status, auto_release_date)
      `)
      .eq("transaction_id", params.transactionId)
      .eq("user_id", user.id)
      .single()

    if (error || !transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.transaction_id,
        amount: transaction.amount,
        currency: transaction.currencies?.code,
        status: transaction.status,
        escrow_status: transaction.escrow_status,
        payment_url: transaction.payment_url,
        qr_code_data: transaction.qr_code_data,
        gateway: transaction.payment_gateways?.display_name,
        gateway_type: transaction.payment_gateways?.type,
        created_at: transaction.created_at,
        expires_at: transaction.expires_at,
        auto_release_date: transaction.escrow_transactions?.[0]?.auto_release_date,
      },
    })
  } catch (error) {
    console.error("[v0] ❌ PAYMENT: Error fetching transaction status:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch transaction status",
      },
      { status: 500 },
    )
  }
}
