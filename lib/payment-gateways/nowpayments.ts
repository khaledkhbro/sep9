// NOWPayments Crypto Gateway Handler
import type { PaymentGateway, PaymentRequest, PaymentResponse } from "@/lib/payment-service"

export interface NOWPaymentsCredentials {
  api_key: string
  ipn_secret: string
  api_url: string
}

export class NOWPaymentsHandler {
  private credentials: NOWPaymentsCredentials
  private isProduction: boolean

  constructor(gateway: PaymentGateway) {
    this.credentials = gateway.api_credentials as NOWPaymentsCredentials
    this.isProduction = !gateway.is_sandbox
  }

  async createPayment(request: PaymentRequest, transaction_id: string): Promise<PaymentResponse> {
    try {
      // First, get available currencies
      const currenciesResponse = await fetch(`${this.credentials.api_url}/v1/currencies`, {
        headers: {
          "x-api-key": this.credentials.api_key,
        },
      })

      if (!currenciesResponse.ok) {
        throw new Error("Failed to fetch available currencies")
      }

      const currencies = await currenciesResponse.json()
      const paymentCurrency = currencies.currencies.includes("btc") ? "btc" : currencies.currencies[0]

      // Create payment
      const paymentData = {
        price_amount: request.amount,
        price_currency: request.currency.toLowerCase(),
        pay_currency: paymentCurrency,
        ipn_callback_url: request.webhook_url,
        order_id: transaction_id,
        order_description: request.description,
      }

      const response = await fetch(`${this.credentials.api_url}/v1/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.credentials.api_key,
        },
        body: JSON.stringify(paymentData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`NOWPayments API error: ${error.message || response.status}`)
      }

      const result = await response.json()

      // Generate QR code for crypto payment
      const qrCodeData = `${paymentCurrency}:${result.pay_address}?amount=${result.pay_amount}&label=${encodeURIComponent(request.description)}`

      return {
        transaction_id,
        external_transaction_id: result.payment_id,
        payment_url: `https://nowpayments.io/payment/?iid=${result.payment_id}`,
        qr_code_data: qrCodeData,
        status: this.mapStatus(result.payment_status),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        gateway_response: result,
      }
    } catch (error) {
      console.error("NOWPayments payment creation failed:", error)
      throw new Error(`NOWPayments payment failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async verifyWebhook(payload: any, signature: string): Promise<boolean> {
    const expectedSignature = this.generateWebhookSignature(JSON.stringify(payload))
    return signature === expectedSignature
  }

  private generateWebhookSignature(payload: string): string {
    return require("crypto").createHmac("sha512", this.credentials.ipn_secret).update(payload).digest("hex")
  }

  private mapStatus(gatewayStatus: string): "pending" | "processing" | "completed" | "failed" {
    switch (gatewayStatus.toLowerCase()) {
      case "waiting":
        return "pending"
      case "confirming":
      case "sending":
        return "processing"
      case "finished":
        return "completed"
      case "failed":
      case "refunded":
      case "expired":
        return "failed"
      default:
        return "pending"
    }
  }
}
