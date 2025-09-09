"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Plus, CreditCard, Wallet, Bitcoin, DollarSign, Clock, AlertCircle } from "lucide-react"
import { CheckoutFlow } from "@/components/payments/checkout-flow"

interface PaymentGateway {
  id: string
  name: string
  displayName: string
  type: "crypto" | "fiat" | "wallet" | "bank"
  logoUrl?: string
  isEnabled: boolean
  isDepositEnabled: boolean
  depositFeePercentage: number
  depositFeeFixed: number
  minDepositAmount: number
  maxDepositAmount?: number
  processingTimeDeposit?: string
  supportedCurrencies: string[]
  isTestMode: boolean
}

interface EnhancedDepositDialogProps {
  onSuccess: () => void
}

export function EnhancedDepositDialog({ onSuccess }: EnhancedDepositDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null)
  const [amount, setAmount] = useState("")
  const [processing, setProcessing] = useState(false)
  const [gateways, setGateways] = useState<PaymentGateway[]>([])
  const [loading, setLoading] = useState(false)
  const [showCheckoutFlow, setShowCheckoutFlow] = useState(false)

  useEffect(() => {
    if (open) {
      loadPaymentGateways()
    }
  }, [open])

  const loadPaymentGateways = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/payments/gateways?type=deposit")
      const data = await response.json()
      setGateways(data.gateways || [])
    } catch (error) {
      console.error("Failed to load payment gateways:", error)
      toast.error("Failed to load payment methods")
      // Fallback to mock data if API fails
      setGateways([
        {
          id: "1",
          name: "ssl_commerce",
          displayName: "SSL Commerce",
          type: "fiat",
          logoUrl: "/payment-logos/ssl-commerce.png",
          isEnabled: true,
          isDepositEnabled: true,
          depositFeePercentage: 2.5,
          depositFeeFixed: 0,
          minDepositAmount: 5,
          maxDepositAmount: 10000,
          processingTimeDeposit: "Instant",
          supportedCurrencies: ["USD", "BDT"],
          isTestMode: false,
        },
        {
          id: "2",
          name: "paypal",
          displayName: "PayPal",
          type: "fiat",
          logoUrl: "/payment-logos/paypal.png",
          isEnabled: true,
          isDepositEnabled: true,
          depositFeePercentage: 3.0,
          depositFeeFixed: 0.3,
          minDepositAmount: 1,
          maxDepositAmount: 25000,
          processingTimeDeposit: "Instant",
          supportedCurrencies: ["USD", "EUR", "GBP"],
          isTestMode: false,
        },
        {
          id: "3",
          name: "stripe",
          displayName: "Stripe",
          type: "fiat",
          logoUrl: "/payment-logos/stripe.png",
          isEnabled: true,
          isDepositEnabled: true,
          depositFeePercentage: 2.9,
          depositFeeFixed: 0.3,
          minDepositAmount: 1,
          maxDepositAmount: 50000,
          processingTimeDeposit: "Instant",
          supportedCurrencies: ["USD", "EUR", "GBP"],
          isTestMode: true,
        },
        {
          id: "4",
          name: "binance_pay",
          displayName: "Binance Pay",
          type: "crypto",
          logoUrl: "/payment-logos/binance-pay.png",
          isEnabled: true,
          isDepositEnabled: true,
          depositFeePercentage: 0,
          depositFeeFixed: 0,
          minDepositAmount: 10,
          maxDepositAmount: 100000,
          processingTimeDeposit: "Instant",
          supportedCurrencies: ["BTC", "ETH", "USDT", "BNB"],
          isTestMode: true,
        },
        {
          id: "5",
          name: "coinbase_commerce",
          displayName: "Coinbase Commerce",
          type: "crypto",
          logoUrl: "/payment-logos/coinbase-commerce.png",
          isEnabled: true,
          isDepositEnabled: true,
          depositFeePercentage: 1.0,
          depositFeeFixed: 0,
          minDepositAmount: 10,
          maxDepositAmount: 50000,
          processingTimeDeposit: "10-60 minutes",
          supportedCurrencies: ["BTC", "ETH", "USDC"],
          isTestMode: false,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const enabledGateways = gateways.filter((g) => g.isEnabled && g.isDepositEnabled)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "crypto":
        return <Bitcoin className="h-4 w-4" />
      case "fiat":
        return <DollarSign className="h-4 w-4" />
      case "wallet":
        return <Wallet className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "crypto":
        return "bg-orange-100 text-orange-800"
      case "fiat":
        return "bg-green-100 text-green-800"
      case "wallet":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calculateFee = (amount: number, gateway: PaymentGateway) => {
    const percentageFee = (amount * gateway.depositFeePercentage) / 100
    return percentageFee + gateway.depositFeeFixed
  }

  const handleQuickDeposit = () => {
    setShowCheckoutFlow(true)
    setOpen(false)
  }

  const handleDepositSuccess = () => {
    setShowCheckoutFlow(false)
    onSuccess()
    toast.success("Deposit completed successfully!")
  }

  const handleDeposit = async () => {
    if (!selectedGateway || !amount) return

    const depositAmount = Number.parseFloat(amount)
    if (depositAmount < selectedGateway.minDepositAmount) {
      toast.error(`Minimum deposit amount is $${selectedGateway.minDepositAmount}`)
      return
    }

    if (selectedGateway.maxDepositAmount && depositAmount > selectedGateway.maxDepositAmount) {
      toast.error(`Maximum deposit amount is $${selectedGateway.maxDepositAmount}`)
      return
    }

    setProcessing(true)
    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: depositAmount,
          currency: "USD",
          gateway_id: selectedGateway.id,
          purpose: "deposit",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Payment creation failed")
      }

      // For fiat payments, redirect to payment URL
      if (selectedGateway.type === "fiat" && data.payment.payment_url) {
        window.open(data.payment.payment_url, "_blank")
      }

      toast.success(`Deposit of $${amount} initiated via ${selectedGateway.displayName}`)
      setOpen(false)
      setAmount("")
      setSelectedGateway(null)
      onSuccess()
    } catch (error) {
      console.error("Deposit failed:", error)
      toast.error(error instanceof Error ? error.message : "Failed to process deposit")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Funds
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Funds to Wallet</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex gap-2">
              <Button onClick={handleQuickDeposit} className="flex-1">
                <Plus className="mr-2 h-4 w-4" />
                Quick Deposit (Recommended)
              </Button>
              <Button variant="outline" onClick={() => setShowCheckoutFlow(false)} className="flex-1">
                <CreditCard className="mr-2 h-4 w-4" />
                Advanced Options
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading payment methods...</span>
              </div>
            ) : !selectedGateway ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Select Payment Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {enabledGateways.map((gateway) => (
                    <Card
                      key={gateway.id}
                      className="cursor-pointer hover:border-blue-300 transition-colors"
                      onClick={() => setSelectedGateway(gateway)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(gateway.type)}
                            <span className="font-medium">{gateway.displayName}</span>
                          </div>
                          <Badge variant="outline" className={getTypeColor(gateway.type)}>
                            {gateway.type}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Fee:</span>
                            <span>
                              {gateway.depositFeePercentage}%
                              {gateway.depositFeeFixed > 0 && ` + $${gateway.depositFeeFixed}`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Min/Max:</span>
                            <span>
                              ${gateway.minDepositAmount}
                              {gateway.maxDepositAmount && ` - $${gateway.maxDepositAmount.toLocaleString()}`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Processing:</span>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{gateway.processingTimeDeposit}</span>
                            </div>
                          </div>
                        </div>

                        {gateway.isTestMode && (
                          <div className="mt-2 flex items-center space-x-1 text-xs text-yellow-600">
                            <AlertCircle className="h-3 w-3" />
                            <span>Test Mode</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Deposit via {selectedGateway.displayName}</h3>
                  <Button variant="outline" size="sm" onClick={() => setSelectedGateway(null)}>
                    Change Method
                  </Button>
                </div>

                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      {getTypeIcon(selectedGateway.type)}
                      <span className="font-medium">{selectedGateway.displayName}</span>
                      <Badge variant="outline" className={getTypeColor(selectedGateway.type)}>
                        {selectedGateway.type}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Processing Time:</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{selectedGateway.processingTimeDeposit}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Supported:</span>
                        <span>{selectedGateway.supportedCurrencies.join(", ")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Deposit Amount (USD)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min={selectedGateway.minDepositAmount}
                      max={selectedGateway.maxDepositAmount}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`Min: $${selectedGateway.minDepositAmount}`}
                    />
                  </div>

                  {amount && Number.parseFloat(amount) > 0 && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Transaction Summary</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Deposit Amount:</span>
                            <span>${Number.parseFloat(amount).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Processing Fee:</span>
                            <span>${calculateFee(Number.parseFloat(amount), selectedGateway).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-1">
                            <span>Total to Pay:</span>
                            <span>
                              $
                              {(
                                Number.parseFloat(amount) + calculateFee(Number.parseFloat(amount), selectedGateway)
                              ).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-green-600">
                            <span>You'll Receive:</span>
                            <span>${Number.parseFloat(amount).toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    onClick={handleDeposit}
                    disabled={!amount || Number.parseFloat(amount) < selectedGateway.minDepositAmount || processing}
                    className="w-full"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Deposit ${amount || "0.00"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CheckoutFlow
        isOpen={showCheckoutFlow}
        onClose={() => setShowCheckoutFlow(false)}
        purpose="deposit"
        initialAmount={0}
      />
    </>
  )
}
