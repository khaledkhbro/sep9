import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { paymentService } from "@/lib/payment-service"

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { gateway_name, amount, currency, seller_id, job_id, description, return_url, cancel_url, metadata } = body

    if (!gateway_name || !amount || !currency || !description) {
      return NextResponse.json(
        {
          error: "Missing required fields: gateway_name, amount, currency, description",
        },
        { status: 400 },
      )
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
    }

    const paymentResponse = await paymentService.createPayment({
      gateway_name,
      amount,
      currency,
      user_id: user.id,
      seller_id,
      job_id,
      description,
      return_url: return_url || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet`,
      cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet`,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook/${gateway_name}`,
      metadata,
    })

    console.log(`[v0] ✅ PAYMENT: Created payment ${paymentResponse.transaction_id} via ${gateway_name}`)

    return NextResponse.json({
      success: true,
      payment: paymentResponse,
    })
  } catch (error) {
    console.error("[v0] ❌ PAYMENT: Error creating payment:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create payment",
      },
      { status: 500 },
    )
  }
}
