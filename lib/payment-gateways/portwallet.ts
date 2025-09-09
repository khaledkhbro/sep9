// PortWallet Payment Gateway Handler
import type { PaymentGateway, PaymentRequest, PaymentResponse } from "@/lib/payment-service"

export interface PortWalletCredentials {
  merchant_id: string
  secret_key: string
  api_url: string
}

export class PortWalletHandler {
  private credentials: PortWalletCredentials
  private isProduction: boolean

  constructor(gateway: PaymentGateway) {
    this.credentials = gateway.api_credentials as PortWalletCredentials
    this.isProduction = !gateway.is_sandbox
  }

  async createPayment(request: PaymentRequest, transaction_id: string): Promise<PaymentResponse> {
    try {
      const paymentData = {
        merchant_id: this.credentials.merchant_id,
        amount: request.amount,
        currency: request.currency,
        order_id: transaction_id,
        description: request.description,
        customer_name: request.metadata?.customer_name || "Customer",
        customer_email: request.metadata?.customer_email || "customer@example.com",
        customer_phone: request.metadata?.customer_phone || "",
        return_url: request.return_url,
        cancel_url: request.cancel_url,
        notify_url: request.webhook_url,
        signature: this.generateSignature(transaction_id, request.amount),
      }

      const response = await fetch(`${this.credentials.api_url}/payment/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.credentials.secret_key}`,
        },
        body: JSON.stringify(paymentData),
      })

      if (!response.ok) {
        throw new Error(`PortWallet API error: ${response.status}`)
      }

      const result = await response.json()

      return {
        transaction_id,
        external_transaction_id: result.payment_id,
        payment_url: result.payment_url,
        status: this.mapStatus(result.status),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        gateway_response: result,
      }
    } catch (error) {
      console.error("PortWallet payment creation failed:", error)
      throw new Error(`PortWallet payment failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async verifyWebhook(payload: any, signature: string): Promise<boolean> {
    const expectedSignature = this.generateWebhookSignature(payload)
    return signature === expectedSignature
  }

  private generateSignature(order_id: string, amount: number): string {
    const data = `${this.credentials.merchant_id}${order_id}${amount}${this.credentials.secret_key}`
    return require("crypto").createHash("md5").update(data).digest("hex")
  }

  private generateWebhookSignature(payload: any): string {
    const data = `${payload.merchant_id}${payload.order_id}${payload.amount}${payload.status}${this.credentials.secret_key}`
    return require("crypto").createHash("md5").update(data).digest("hex")
  }

  private mapStatus(gatewayStatus: string): "pending" | "processing" | "completed" | "failed" {
    switch (gatewayStatus.toLowerCase()) {
      case "pending":
      case "initiated":
        return "pending"
      case "processing":
        return "processing"
      case "success":
      case "completed":
        return "completed"
      case "failed":
      case "cancelled":
        return "failed"
      default:
        return "pending"
    }
  }
}
