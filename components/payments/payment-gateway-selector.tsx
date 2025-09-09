"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CreditCard, Bitcoin, Wallet, Globe } from "lucide-react"

interface PaymentGateway {
  id: string
  name: string
  type: "fiat" | "crypto"
  currencies: string[]
  countries: string[]
  fee_percentage: number
  fee_fixed: number
  min_amount: number
  max_amount: number
  is_enabled: boolean
  logo_url?: string
}

interface PaymentGatewaySelectorProps {
  amount: number
  currency: string
  country: string
  onGatewaySelect: (gateway: PaymentGateway) => void
  selectedGateway?: PaymentGateway
}

export function PaymentGatewaySelector({
  amount,
  currency,
  country,
  onGatewaySelect,
  selectedGateway,
}: PaymentGatewaySelectorProps) {
  const [gateways, setGateways] = useState<PaymentGateway[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "fiat" | "crypto">("all")

  useEffect(() => {
    fetchAvailableGateways()
  }, [amount, currency, country])

  const fetchAvailableGateways = async () => {
    try {
      const response = await fetch(`/api/payments/gateways?amount=${amount}&currency=${currency}&country=${country}`)
      const data = await response.json()
      setGateways(data.gateways || [])
    } catch (error) {
      console.error("Failed to fetch payment gateways:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateFee = (gateway: PaymentGateway) => {
    return (amount * gateway.fee_percentage) / 100 + gateway.fee_fixed
  }

  const calculateTotal = (gateway: PaymentGateway) => {
    return amount + calculateFee(gateway)
  }

  const filteredGateways = gateways.filter((gateway) => {
    if (filter === "all") return true
    return gateway.type === filter
  })

  const getGatewayIcon = (gateway: PaymentGateway) => {
    if (gateway.type === "crypto") return <Bitcoin className="h-5 w-5" />
    if (gateway.name.toLowerCase().includes("wallet")) return <Wallet className="h-5 w-5" />
    return <CreditCard className="h-5 w-5" />
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading payment methods...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
          All Methods
        </Button>
        <Button variant={filter === "fiat" ? "default" : "outline"} size="sm" onClick={() => setFilter("fiat")}>
          <CreditCard className="h-4 w-4 mr-1" />
          Fiat
        </Button>
        <Button variant={filter === "crypto" ? "default" : "outline"} size="sm" onClick={() => setFilter("crypto")}>
          <Bitcoin className="h-4 w-4 mr-1" />
          Crypto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGateways.map((gateway) => (
          <Card
            key={gateway.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedGateway?.id === gateway.id ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => onGatewaySelect(gateway)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getGatewayIcon(gateway)}
                  <span className="font-medium">{gateway.name}</span>
                </div>
                <Badge variant={gateway.type === "crypto" ? "secondary" : "default"}>{gateway.type}</Badge>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Fee:</span>
                  <span>
                    {gateway.fee_percentage}% + {gateway.fee_fixed} {currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Fee:</span>
                  <span>
                    {calculateFee(gateway).toFixed(2)} {currency}
                  </span>
                </div>
                <div className="flex justify-between font-medium text-foreground">
                  <span>Total:</span>
                  <span>
                    {calculateTotal(gateway).toFixed(2)} {currency}
                  </span>
                </div>
              </div>

              {gateway.type === "crypto" && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  <span>Global availability</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGateways.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              No payment methods available for {currency} in {country}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
