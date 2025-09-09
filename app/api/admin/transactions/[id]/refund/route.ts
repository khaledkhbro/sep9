import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { data: result, error } = await supabase
      .from("payment_transactions")
      .update({
        status: "refunded",
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "completed")
      .select("id, amount, currency_code, user_id")
      .single()

    if (error || !result) {
      return NextResponse.json(
        {
          success: false,
          error: "Transaction not found or cannot be refunded",
        },
        { status: 404 },
      )
    }

    const { error: balanceError } = await supabase.rpc("add_user_balance", {
      user_id: result.user_id,
      amount: result.amount,
    })

    if (balanceError) throw balanceError

    console.log(`[v0] ✅ REFUND: Processed refund for transaction ${id}`)

    return NextResponse.json({
      success: true,
      message: "Refund processed successfully",
      refund: {
        transaction_id: id,
        amount: result.amount,
        currency: result.currency_code,
      },
    })
  } catch (error) {
    console.error("Error processing refund:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process refund",
      },
      { status: 500 },
    )
  }
}
