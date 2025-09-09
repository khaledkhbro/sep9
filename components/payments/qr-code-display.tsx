"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Clock, QrCode } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface QRCodeDisplayProps {
  qrCode: string
  address?: string
  amount?: string
  expiresAt?: string
}

export function QRCodeDisplay({ qrCode, address, amount, expiresAt }: QRCodeDisplayProps) {
  const [timeLeft, setTimeLeft] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    if (!expiresAt) return

    const updateTimer = () => {
      const now = new Date().getTime()
      const expiry = new Date(expiresAt).getTime()
      const difference = expiry - now

      if (difference > 0) {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`)
      } else {
        setTimeLeft("Expired")
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Crypto Payment
        </CardTitle>
        {expiresAt && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">
              Expires in: <Badge variant="outline">{timeLeft}</Badge>
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="bg-white p-4 rounded-lg inline-block">
            <img src={qrCode || "/placeholder.svg"} alt="Payment QR Code" className="w-48 h-48 mx-auto" />
          </div>
          <p className="text-sm text-muted-foreground mt-2">Scan this QR code with your crypto wallet</p>
        </div>

        {address && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Address:</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-xs break-all">{address}</code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(address, "Address")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {amount && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount to Send:</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-sm">{amount}</code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(amount, "Amount")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Important:</strong> Send the exact amount to the address above. Your payment will be automatically
            confirmed once the transaction is detected on the blockchain.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
