// 2Checkout (Stripe-powered) Payment Gateway Handler
import type { PaymentGateway, PaymentRequest, PaymentResponse } from "@/lib/payment-service"

export interface TwoCheckoutCredentials {
  merchant_code: string
  secret_key: string
  api_url: string
}

export class TwoCheckoutHandler {
  private credentials: TwoCheckoutCredentials
  private isProduction: boolean

  constructor(gateway: PaymentGateway) {
    this.credentials = gateway.api_credentials as TwoCheckoutCredentials
    this.isProduction = !gateway.is_sandbox
  }

  async createPayment(request: PaymentRequest, transaction_id: string): Promise<PaymentResponse> {
    try {
      const paymentData = {
        sid: this.credentials.merchant_code,
        mode: "2CO",
        li_0_type: "product",
        li_0_name: request.description,
        li_0_price: request.amount,
        li_0_quantity: 1,
        currency_code: request.currency,
        merchant_order_id: transaction_id,
        return_url: request.return_url,
        x_receipt_link_url: request.return_url,
        approved_url: request.return_url,
        declined_url: request.cancel_url,
        pending_url: request.return_url,
        demo: this.isProduction ? "N" : "Y",
      }

      // 2Checkout uses form-based redirect, so we create a payment URL
      const params = new URLSearchParams(paymentData as any)
      const paymentUrl = `${this.credentials.api_url}/checkout/purchase?${params.toString()}`

      return {
        transaction_id,
        external_transaction_id: `2co_${transaction_id}`,
        payment_url: paymentUrl,
        status: "pending",
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        gateway_response: { payment_url: paymentUrl },
      }
    } catch (error) {
      console.error("2Checkout payment creation failed:", error)
      throw new Error(`2Checkout payment failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async verifyWebhook(payload: any, signature: string): Promise<boolean> {
    const expectedSignature = this.generateWebhookSignature(payload)
    return signature === expectedSignature
  }

  private generateWebhookSignature(payload: any): string {
    const data = `${payload.sale_id}${payload.vendor_id}${payload.invoice_id}${this.credentials.secret_key}`
    return require("crypto").createHash("md5").update(data).digest("hex").toUpperCase()
  }

  mapStatus(gatewayStatus: string): "pending" | "processing" | "completed" | "failed" {
    switch (gatewayStatus.toLowerCase()) {
      case "order_created":
        return "pending"
      case "fraud_review":
        return "processing"
      case "invoice_status_approved":
        return "completed"
      case "refund_issued":
      case "order_cancelled":
        return "failed"
      default:
        return "pending"
    }
  }
}
