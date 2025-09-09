// CoinGate Crypto Payment Gateway Handler
import type { PaymentGateway, PaymentRequest, PaymentResponse } from "@/lib/payment-service"

export interface CoinGateCredentials {
  api_key: string
  api_secret: string
  api_url: string
}

export class CoinGateHandler {
  private credentials: CoinGateCredentials
  private isProduction: boolean

  constructor(gateway: PaymentGateway) {
    this.credentials = gateway.api_credentials as CoinGateCredentials
    this.isProduction = !gateway.is_sandbox
  }

  async createPayment(request: PaymentRequest, transaction_id: string): Promise<PaymentResponse> {
    try {
      const paymentData = {
        order_id: transaction_id,
        price_amount: request.amount,
        price_currency: request.currency,
        receive_currency: "BTC", // Default to Bitcoin
        title: request.description,
        description: request.description,
        callback_url: request.webhook_url,
        cancel_url: request.cancel_url,
        success_url: request.return_url,
        token: this.credentials.api_key,
      }

      const response = await fetch(`${this.credentials.api_url}/v2/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${this.credentials.api_key}`,
        },
        body: JSON.stringify(paymentData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`CoinGate API error: ${error.message || response.status}`)
      }

      const result = await response.json()

      // Generate QR code data for crypto payment
      const qrCodeData = `bitcoin:${result.payment_address}?amount=${result.pay_amount}&label=${encodeURIComponent(request.description)}`

      return {
        transaction_id,
        external_transaction_id: result.id.toString(),
        payment_url: result.payment_url,
        qr_code_data: qrCodeData,
        status: this.mapStatus(result.status),
        expires_at: result.expire_at,
        gateway_response: result,
      }
    } catch (error) {
      console.error("CoinGate payment creation failed:", error)
      throw new Error(`CoinGate payment failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async verifyWebhook(payload: any, signature: string): Promise<boolean> {
    const expectedSignature = this.generateWebhookSignature(JSON.stringify(payload))
    return signature === expectedSignature
  }

  private generateWebhookSignature(payload: string): string {
    return require("crypto").createHmac("sha256", this.credentials.api_secret).update(payload).digest("hex")
  }

  private mapStatus(gatewayStatus: string): "pending" | "processing" | "completed" | "failed" {
    switch (gatewayStatus.toLowerCase()) {
      case "new":
      case "pending":
        return "pending"
      case "confirming":
        return "processing"
      case "paid":
      case "confirmed":
        return "completed"
      case "expired":
      case "canceled":
      case "refunded":
        return "failed"
      default:
        return "pending"
    }
  }
}
