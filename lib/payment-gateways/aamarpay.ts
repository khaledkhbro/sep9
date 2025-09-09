// AamarPay Payment Gateway Handler
import type { PaymentGateway, PaymentRequest, PaymentResponse } from "@/lib/payment-service"

export interface AamarPayCredentials {
  store_id: string
  signature_key: string
  api_url: string
}

export class AamarPayHandler {
  private credentials: AamarPayCredentials
  private isProduction: boolean

  constructor(gateway: PaymentGateway) {
    this.credentials = gateway.api_credentials as AamarPayCredentials
    this.isProduction = !gateway.is_sandbox
  }

  async createPayment(request: PaymentRequest, transaction_id: string): Promise<PaymentResponse> {
    try {
      const paymentData = {
        store_id: this.credentials.store_id,
        tran_id: transaction_id,
        success_url: request.return_url,
        fail_url: request.cancel_url,
        cancel_url: request.cancel_url,
        ipn_url: request.webhook_url,
        amount: request.amount,
        currency: request.currency,
        signature_key: this.credentials.signature_key,
        desc: request.description,
        cus_name: request.metadata?.customer_name || "Customer",
        cus_email: request.metadata?.customer_email || "customer@example.com",
        cus_phone: request.metadata?.customer_phone || "01700000000",
        cus_add1: request.metadata?.customer_address || "Dhaka",
        cus_city: request.metadata?.customer_city || "Dhaka",
        cus_country: request.metadata?.customer_country || "Bangladesh",
        type: "json",
      }

      const response = await fetch(`${this.credentials.api_url}/request.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      })

      if (!response.ok) {
        throw new Error(`AamarPay API error: ${response.status}`)
      }

      const result = await response.json()

      if (result.result !== "true") {
        throw new Error(`AamarPay error: ${result.reason}`)
      }

      return {
        transaction_id,
        external_transaction_id: result.payment_id,
        payment_url: result.payment_url,
        status: "pending",
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        gateway_response: result,
      }
    } catch (error) {
      console.error("AamarPay payment creation failed:", error)
      throw new Error(`AamarPay payment failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async verifyWebhook(payload: any, signature: string): Promise<boolean> {
    const expectedSignature = this.generateWebhookSignature(payload)
    return signature === expectedSignature
  }

  private generateWebhookSignature(payload: any): string {
    const data = `${payload.store_id}${payload.pay_status}${payload.pay_time}${payload.mer_txnid}${payload.amount}${payload.currency}${this.credentials.signature_key}`
    return require("crypto").createHash("md5").update(data).digest("hex")
  }

  mapStatus(gatewayStatus: string): "pending" | "processing" | "completed" | "failed" {
    switch (gatewayStatus.toLowerCase()) {
      case "successful":
      case "success":
        return "completed"
      case "pending":
        return "pending"
      case "processing":
        return "processing"
      case "failed":
      case "cancelled":
        return "failed"
      default:
        return "pending"
    }
  }
}
