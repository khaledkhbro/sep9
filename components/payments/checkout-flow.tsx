"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react"
import { PaymentGatewaySelector } from "./payment-gateway-selector"
import { QRCodeDisplay } from "./qr-code-display"

interface CheckoutFlowProps {
  isOpen: boolean
  onClose: () => void
  initialAmount?: number
  purpose: "deposit" | "payment" | "escrow"
  jobId?: string
  recipientId?: string
}

interface PaymentGateway {
  id: string
  name: string
  type: "fiat" | "crypto"
  fee_percentage: number
  fee_fixed: number
}

interface PaymentStatus {
  status: "pending" | "processing" | "completed" | "failed" | "expired"
  transaction_id: string
  payment_url?: string
  qr_code?: string
  crypto_address?: string
  crypto_amount?: string
  expires_at?: string
}

export function CheckoutFlow({ isOpen, onClose, initialAmount = 0, purpose, jobId, recipientId }: CheckoutFlowProps) {
  const [step, setStep] = useState<"amount" | "gateway" | "processing" | "status">("amount")
  const [amount, setAmount] = useState(initialAmount.toString())
  const [currency, setCurrency] = useState("USD")
  const [country, setCountry] = useState("US")
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get user's location and preferred currency
  useEffect(() => {
    if (isOpen) {
      detectUserLocation()
    }
  }, [isOpen])

  const detectUserLocation = async () => {
    try {
      const response = await fetch("/api/user/location")
      const data = await response.json()
      if (data.country) setCountry(data.country)
      if (data.currency) setCurrency(data.currency)
    } catch (error) {
      console.error("Failed to detect location:", error)
    }
  }

  const handleAmountSubmit = () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }
    setError(null)
    setStep("gateway")
  }

  const handleGatewaySelect = (gateway: PaymentGateway) => {
    setSelectedGateway(gateway)
  }

  const handlePaymentSubmit = async () => {
    if (!selectedGateway) return

    setLoading(true)
    setError(null)
    setStep("processing")

    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number.parseFloat(amount),
          currency,
          gateway_id: selectedGateway.id,
          purpose,
          job_id: jobId,
          recipient_id: recipientId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Payment creation failed")
      }

      setPaymentStatus(data.payment)
      setStep("status")

      // For fiat payments, redirect to payment URL
      if (selectedGateway.type === "fiat" && data.payment.payment_url) {
        window.open(data.payment.payment_url, "_blank")
      }

      // Start polling for payment status
      startStatusPolling(data.payment.transaction_id)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Payment failed")
      setStep("gateway")
    } finally {
      setLoading(false)
    }
  }

  const startStatusPolling = (transactionId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/status/${transactionId}`)
        const data = await response.json()

        setPaymentStatus(data.payment)

        if (
          data.payment.status === "completed" ||
          data.payment.status === "failed" ||
          data.payment.status === "expired"
        ) {
          clearInterval(pollInterval)
        }
      } catch (error) {
        console.error("Status polling failed:", error)
      }
    }, 3000)

    // Clear polling after 30 minutes
    setTimeout(() => clearInterval(pollInterval), 30 * 60 * 1000)
  }

  const calculateFee = () => {
    if (!selectedGateway) return 0
    return (Number.parseFloat(amount) * selectedGateway.fee_percentage) / 100 + selectedGateway.fee_fixed
  }

  const calculateTotal = () => {
    return Number.parseFloat(amount) + calculateFee()
  }

  const resetFlow = () => {
    setStep("amount")
    setAmount(initialAmount.toString())
    setSelectedGateway(null)
    setPaymentStatus(null)
    setError(null)
    setLoading(false)
  }

  const handleClose = () => {
    resetFlow()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {purpose === "deposit" && "Add Funds to Wallet"}
            {purpose === "payment" && "Make Payment"}
            {purpose === "escrow" && "Escrow Payment"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "amount" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="BDT">BDT</option>
                </select>
              </div>
            </div>
            <Button onClick={handleAmountSubmit} className="w-full">
              Continue to Payment Methods
            </Button>
          </div>
        )}

        {step === "gateway" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep("amount")}>
                ← Back
              </Button>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-medium">
                  {amount} {currency}
                </p>
              </div>
            </div>

            <PaymentGatewaySelector
              amount={Number.parseFloat(amount)}
              currency={currency}
              country={country}
              onGatewaySelect={handleGatewaySelect}
              selectedGateway={selectedGateway}
            />

            {selectedGateway && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>
                      {amount} {currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Fee:</span>
                    <span>
                      {calculateFee().toFixed(2)} {currency}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>
                      {calculateTotal().toFixed(2)} {currency}
                    </span>
                  </div>
                  <Button onClick={handlePaymentSubmit} className="w-full mt-4">
                    Proceed with {selectedGateway.name}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step === "processing" && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Processing Payment</h3>
            <p className="text-muted-foreground">Please wait while we set up your payment...</p>
          </div>
        )}

        {step === "status" && paymentStatus && (
          <div className="space-y-4">
            <div className="text-center">
              {paymentStatus.status === "pending" && (
                <>
                  <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Payment Pending</h3>
                </>
              )}
              {paymentStatus.status === "processing" && (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Processing Payment</h3>
                </>
              )}
              {paymentStatus.status === "completed" && (
                <>
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Payment Successful</h3>
                </>
              )}
              {paymentStatus.status === "failed" && (
                <>
                  <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Payment Failed</h3>
                </>
              )}
            </div>

            {selectedGateway?.type === "crypto" && paymentStatus.qr_code && (
              <QRCodeDisplay
                qrCode={paymentStatus.qr_code}
                address={paymentStatus.crypto_address}
                amount={paymentStatus.crypto_amount}
                expiresAt={paymentStatus.expires_at}
              />
            )}

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Transaction ID:</span>
                    <span className="font-mono">{paymentStatus.transaction_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="capitalize">{paymentStatus.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>
                      {amount} {currency}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {paymentStatus.status === "completed" && (
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            )}

            {paymentStatus.status === "failed" && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("gateway")} className="flex-1">
                  Try Again
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Close
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
