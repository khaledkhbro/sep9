import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { id } = params

    const { error } = await supabase
      .from("payment_gateway_settings")
      .update({
        is_enabled: body.is_enabled,
        deposit_enabled: body.deposit_enabled,
        withdrawal_enabled: body.withdrawal_enabled,
        deposit_fee_percentage: body.deposit_fee_percentage,
        deposit_fee_fixed: body.deposit_fee_fixed,
        withdrawal_fee_percentage: body.withdrawal_fee_percentage,
        withdrawal_fee_fixed: body.withdrawal_fee_fixed,
        min_deposit_amount: body.min_deposit_amount,
        max_deposit_amount: body.max_deposit_amount,
        min_withdrawal_amount: body.min_withdrawal_amount,
        max_withdrawal_amount: body.max_withdrawal_amount,
        is_test_mode: body.is_test_mode,
        sort_order: body.sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating payment gateway:", error)
    return NextResponse.json({ success: false, error: "Failed to update payment gateway" }, { status: 500 })
  }
}
