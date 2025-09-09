// Unified Payment Service - Handles all payment gateway integrations
import { createServerClient } from "@/lib/supabase/server"
import { PaymentGatewayFactory } from "./payment-gateways"

export interface PaymentGateway {
  id: number
  name: string
  display_name: string
  type: "fiat" | "crypto"
  is_enabled: boolean
  fee_percentage: number
  fee_fixed: number
  min_amount: number
  max_amount: number
  supported_currencies: string[]
  supported_countries: string[]
  api_credentials: Record<string, any>
  webhook_url: string
  is_sandbox: boolean
}

export interface PaymentRequest {
  gateway_name: string
  amount: number
  currency: string
  user_id: string
  seller_id?: string
  job_id?: string
  description: string
  return_url?: string
  cancel_url?: string
  webhook_url?: string
  metadata?: Record<string, any>
}

export interface PaymentResponse {
  transaction_id: string
  external_transaction_id?: string
  payment_url?: string
  qr_code_data?: string
  status: "pending" | "processing" | "completed" | "failed"
  expires_at?: string
  gateway_response?: Record<string, any>
}

export interface WebhookEvent {
  gateway_name: string
  event_type: string
  event_id: string
  transaction_id?: string
  payload: Record<string, any>
  headers: Record<string, string>
}

export class UnifiedPaymentService {
  private supabase = createServerClient()

  async getAvailableGateways(country_code?: string, currency?: string): Promise<PaymentGateway[]> {
    try {
      const query = this.supabase.from("payment_gateway_settings").select("*").eq("is_enabled", true)

      const { data: gateways, error } = await query

      if (error) {
        console.error("[v0] ❌ PAYMENT: Error fetching payment gateways:", error)
        return []
      }

      if (!gateways || gateways.length === 0) {
        console.log("[v0] ⚠️ PAYMENT: No payment gateways found or table is empty")
        return []
      }

      // Filter by country and currency support
      const filteredGateways = gateways.filter((gateway) => {
        const countriesSupported =
          !country_code || !gateway.supported_countries?.length || gateway.supported_countries.includes(country_code)

        const currencySupported =
          !currency || !gateway.supported_currencies?.length || gateway.supported_currencies.includes(currency)

        return countriesSupported && currencySupported
      })

      console.log(`[v0] ✅ PAYMENT: Found ${filteredGateways.length} available gateways`)
      return filteredGateways
    } catch (error) {
      console.error("[v0] ❌ PAYMENT: Unexpected error in getAvailableGateways:", error)
      return []
    }
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Get gateway configuration
      const { data: gateway } = await this.supabase
        .from("payment_gateway_settings")
        .select("*")
        .eq("name", request.gateway_name)
        .eq("is_enabled", true)
        .single()

      if (!gateway) {
        throw new Error(`Payment gateway ${request.gateway_name} not found or disabled`)
      }

      // Validate amount limits
      if (request.amount < gateway.min_amount || request.amount > gateway.max_amount) {
        throw new Error(`Amount must be between ${gateway.min_amount} and ${gateway.max_amount}`)
      }

      // Create escrow transaction using stored procedure
      const { data: transactionResult } = await this.supabase.rpc("create_escrow_transaction", {
        p_user_id: request.user_id,
        p_seller_id: request.seller_id,
        p_job_id: request.job_id,
        p_gateway_name: request.gateway_name,
        p_amount: request.amount,
        p_currency_code: request.currency,
        p_auto_release_days: 7,
      })

      const transaction_id = transactionResult

      // Process payment based on gateway type
      let paymentResponse: PaymentResponse

      if (gateway.type === "crypto") {
        paymentResponse = await this.processCryptoPayment(gateway, request, transaction_id)
      } else {
        paymentResponse = await this.processFiatPayment(gateway, request, transaction_id)
      }

      // Update transaction with external details
      await this.supabase
        .from("transactions")
        .update({
          external_transaction_id: paymentResponse.external_transaction_id,
          payment_url: paymentResponse.payment_url,
          qr_code_data: paymentResponse.qr_code_data,
          status: paymentResponse.status,
          expires_at: paymentResponse.expires_at,
        })
        .eq("transaction_id", transaction_id)

      return {
        ...paymentResponse,
        transaction_id,
      }
    } catch (error) {
      console.error("Error creating payment:", error)
      throw error
    }
  }

  private async processFiatPayment(
    gateway: PaymentGateway,
    request: PaymentRequest,
    transaction_id: string,
  ): Promise<PaymentResponse> {
    const handler = PaymentGatewayFactory.createHandler(gateway)
    return handler.createPayment(request, transaction_id)
  }

  private async processCryptoPayment(
    gateway: PaymentGateway,
    request: PaymentRequest,
    transaction_id: string,
  ): Promise<PaymentResponse> {
    const handler = PaymentGatewayFactory.createHandler(gateway)
    return handler.createPayment(request, transaction_id)
  }

  async processWebhook(webhook: WebhookEvent): Promise<boolean> {
    try {
      // Get gateway configuration
      const { data: gateway } = await this.supabase
        .from("payment_gateway_settings")
        .select("*")
        .eq("name", webhook.gateway_name)
        .single()

      if (!gateway) {
        console.error(`Gateway not found: ${webhook.gateway_name}`)
        return false
      }

      // Log webhook event
      const { data: webhookRecord } = await this.supabase
        .from("webhook_events")
        .insert({
          payment_gateway_id: gateway.id,
          event_type: webhook.event_type,
          event_id: webhook.event_id,
          payload: webhook.payload,
          headers: webhook.headers,
          processed: false,
        })
        .select()
        .single()

      // Process webhook using specific handler
      const handler = PaymentGatewayFactory.createHandler(gateway)
      const signature = webhook.headers["x-signature"] || webhook.headers["signature"] || ""

      const isValid = await handler.verifyWebhook(webhook.payload, signature)
      if (!isValid) {
        console.error("Invalid webhook signature")
        return false
      }

      // Update transaction status based on webhook
      let processed = false
      if (webhook.event_type.includes("completed") || webhook.event_type.includes("success")) {
        await this.updateTransactionStatus(webhook.transaction_id || webhook.payload.order_id, "completed")
        await this.releaseEscrowFunds(webhook.transaction_id || webhook.payload.order_id)
        processed = true
      } else if (webhook.event_type.includes("failed") || webhook.event_type.includes("cancelled")) {
        await this.updateTransactionStatus(webhook.transaction_id || webhook.payload.order_id, "failed")
        processed = true
      }

      // Update webhook processing status
      await this.supabase
        .from("webhook_events")
        .update({
          processed,
          processed_at: new Date().toISOString(),
          error_message: processed ? null : "Failed to process webhook",
        })
        .eq("id", webhookRecord.id)

      return processed
    } catch (error) {
      console.error("Error processing webhook:", error)
      return false
    }
  }

  async convertCurrency(amount: number, from_currency: string, to_currency: string): Promise<number> {
    if (from_currency === to_currency) return amount

    const { data: fromRate } = await this.supabase
      .from("currencies")
      .select("exchange_rate")
      .eq("code", from_currency)
      .single()

    const { data: toRate } = await this.supabase
      .from("currencies")
      .select("exchange_rate")
      .eq("code", to_currency)
      .single()

    if (!fromRate || !toRate) {
      throw new Error(`Currency conversion not supported: ${from_currency} to ${to_currency}`)
    }

    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate.exchange_rate
    return usdAmount * toRate.exchange_rate
  }

  private async updateTransactionStatus(transaction_id: string, status: string): Promise<void> {
    await this.supabase
      .from("transactions")
      .update({
        status,
        completed_at: status === "completed" ? new Date().toISOString() : null,
      })
      .eq("transaction_id", transaction_id)
  }

  private async releaseEscrowFunds(transaction_id: string): Promise<void> {
    await this.supabase.rpc("release_escrow_funds", {
      p_transaction_id: transaction_id,
      p_release_reason: "payment_completed",
    })
  }
}

export const paymentService = new UnifiedPaymentService()
