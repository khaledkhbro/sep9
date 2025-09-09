// Coinbase Commerce Crypto Payment Gateway Handler
import type { PaymentGateway, PaymentRequest, PaymentResponse } from "@/lib/payment-service"

export interface CoinbaseCommerceCredentials {
  api_key: string
  webhook_secret: string
  api_url: string
}

export class CoinbaseCommerceHandler {
  private credentials: CoinbaseCommerceCredentials
  private isProduction: boolean

  constructor(gateway: PaymentGateway) {
    this.credentials = gateway.api_credentials as CoinbaseCommerceCredentials
    this.isProduction = !gateway.is_sandbox
  }

  async createPayment(request: PaymentRequest, transaction_id: string): Promise<PaymentResponse> {
    try {
      const chargeData = {
        name: request.description,
        description: request.description,
        local_price: {
          amount: request.amount.toString(),
          currency: request.currency,
        },
        pricing_type: "fixed_price",
        metadata: {
          order_id: transaction_id,
          customer_id: request.user_id,
        },
        redirect_url: request.return_url,
        cancel_url: request.cancel_url,
      }

      const response = await fetch(`${this.credentials.api_url}/charges`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CC-Api-Key": this.credentials.api_key,
          "X-CC-Version": "2018-03-22",
        },
        body: JSON.stringify(chargeData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Coinbase Commerce API error: ${error.error?.message || response.status}`)
      }

      const result = await response.json()
      const charge = result.data

      // Get the first available payment address for QR code
      const addresses = charge.addresses || {}
      const firstCurrency = Object.keys(addresses)[0]
      const paymentAddress = addresses[firstCurrency]

      const qrCodeData =
        firstCurrency && paymentAddress
          ? `${firstCurrency.toLowerCase()}:${paymentAddress}?amount=${charge.pricing[firstCurrency]?.amount}&label=${encodeURIComponent(request.description)}`
          : undefined

      return {
        transaction_id,
        external_transaction_id: charge.id,
        payment_url: charge.hosted_url,
        qr_code_data: qrCodeData,
        status: this.mapStatus(charge.timeline[charge.timeline.length - 1]?.status || "NEW"),
        expires_at: charge.expires_at,
        gateway_response: charge,
      }
    } catch (error) {
      console.error("Coinbase Commerce payment creation failed:", error)
      throw new Error(`Coinbase Commerce payment failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async verifyWebhook(payload: any, signature: string): Promise<boolean> {
    const expectedSignature = this.generateWebhookSignature(JSON.stringify(payload))
    return signature === expectedSignature
  }

  private generateWebhookSignature(payload: string): string {
    return require("crypto").createHmac("sha256", this.credentials.webhook_secret).update(payload).digest("hex")
  }

  private mapStatus(gatewayStatus: string): "pending" | "processing" | "completed" | "failed" {
    switch (gatewayStatus.toUpperCase()) {
      case "NEW":
        return "pending"
      case "PENDING":
        return "processing"
      case "CONFIRMED":
      case "COMPLETED":
        return "completed"
      case "EXPIRED":
      case "CANCELED":
      case "REFUND_PENDING":
      case "REFUNDED":
        return "failed"
      default:
        return "pending"
    }
  }
}
