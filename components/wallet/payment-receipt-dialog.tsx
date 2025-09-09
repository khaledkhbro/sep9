"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { TransactionAmount } from "@/components/ui/price-display"
import type { WalletTransaction } from "@/lib/wallet"
import { Download, Printer, Receipt } from "lucide-react"

interface PaymentReceiptDialogProps {
  transaction: WalletTransaction
  isOpen: boolean
  onClose: () => void
}

export function PaymentReceiptDialog({ transaction, isOpen, onClose }: PaymentReceiptDialogProps) {
  const downloadReceipt = () => {
    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt - ${transaction.id}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .receipt-info { margin: 20px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #16a34a; }
            .details { margin: 20px 0; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payment Receipt</h1>
            <p>WorkHub Platform</p>
          </div>
          
          <div class="receipt-info">
            <h2>Transaction Details</h2>
            <p><strong>Receipt #:</strong> ${transaction.id}</p>
            <p><strong>Date:</strong> ${format(new Date(transaction.createdAt), "PPP 'at' p")}</p>
            <p><strong>Type:</strong> ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</p>
            <p><strong>Status:</strong> ${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</p>
          </div>

          <div class="details">
            <h3>Amount Details</h3>
            <p><strong>Base Amount:</strong> $${Math.abs(transaction.amount).toFixed(2)}</p>
            ${transaction.feeAmount > 0 ? `<p><strong>Processing Fee:</strong> $${transaction.feeAmount.toFixed(2)}</p>` : ""}
            <hr>
            <p class="amount"><strong>Total Amount:</strong> $${Math.abs(transaction.netAmount).toFixed(2)}</p>
          </div>

          <div class="details">
            <h3>Description</h3>
            <p>${transaction.description}</p>
            ${transaction.referenceId ? `<p><strong>Reference ID:</strong> ${transaction.referenceId}</p>` : ""}
          </div>

          <div class="footer">
            <p>This is an electronic receipt for your transaction.</p>
            <p>Generated on ${format(new Date(), "PPP 'at' p")}</p>
          </div>
        </body>
      </html>
    `

    const blob = new Blob([receiptContent], { type: "text/html" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `receipt-${transaction.id}.html`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const printReceipt = () => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px;">
          <h1>Payment Receipt</h1>
          <p>WorkHub Platform</p>
        </div>
        
        <div style="margin: 20px 0;">
          <h2>Transaction Details</h2>
          <p><strong>Receipt #:</strong> ${transaction.id}</p>
          <p><strong>Date:</strong> ${format(new Date(transaction.createdAt), "PPP 'at' p")}</p>
          <p><strong>Type:</strong> ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</p>
          <p><strong>Status:</strong> ${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3>Amount Details</h3>
          <p><strong>Base Amount:</strong> $${Math.abs(transaction.amount).toFixed(2)}</p>
          ${transaction.feeAmount > 0 ? `<p><strong>Processing Fee:</strong> $${transaction.feeAmount.toFixed(2)}</p>` : ""}
          <hr>
          <p style="font-size: 24px; font-weight: bold; color: #16a34a;"><strong>Total Amount:</strong> $${Math.abs(transaction.netAmount).toFixed(2)}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3>Description</h3>
          <p>${transaction.description}</p>
          ${transaction.referenceId ? `<p><strong>Reference ID:</strong> ${transaction.referenceId}</p>` : ""}
        </div>

        <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
          <p>This is an electronic receipt for your transaction.</p>
          <p>Generated on ${format(new Date(), "PPP 'at' p")}</p>
        </div>
      </div>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment Receipt
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">WorkHub Platform</h2>
              <p className="text-gray-600">Payment Receipt</p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Transaction Details</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Receipt #:</span>
                    <span className="font-mono">{transaction.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span>{format(new Date(transaction.createdAt), "PPP 'at' p")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="capitalize">{transaction.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="capitalize text-green-600">{transaction.status}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Amount Details</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Amount:</span>
                    <TransactionAmount amount={Math.abs(transaction.amount)} />
                  </div>
                  {transaction.feeAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processing Fee:</span>
                      <TransactionAmount amount={transaction.feeAmount} />
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total Amount:</span>
                    <TransactionAmount amount={Math.abs(transaction.netAmount)} />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-sm text-gray-700">{transaction.description}</p>
                {transaction.referenceId && (
                  <p className="text-xs text-gray-500 mt-1">Reference: {transaction.referenceId}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={downloadReceipt} variant="outline" className="flex-1 bg-transparent">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button onClick={printReceipt} variant="outline" className="flex-1 bg-transparent">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>

            <div className="text-center mt-4">
              <p className="text-xs text-gray-500">This is an electronic receipt for your transaction.</p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
