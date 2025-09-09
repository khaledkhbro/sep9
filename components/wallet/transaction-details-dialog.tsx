"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { TransactionAmount } from "@/components/ui/price-display"
import type { WalletTransaction } from "@/lib/wallet"
import { CreditCard, Clock, Hash, FileText, DollarSign, AlertCircle } from "lucide-react"

interface TransactionDetailsDialogProps {
  transaction: WalletTransaction
  isOpen: boolean
  onClose: () => void
}

export function TransactionDetailsDialog({ transaction, isOpen, onClose }: TransactionDetailsDialogProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "earning":
        return "bg-green-100 text-green-800"
      case "deposit":
        return "bg-blue-100 text-blue-800"
      case "withdrawal":
        return "bg-purple-100 text-purple-800"
      case "payment":
        return "bg-orange-100 text-orange-800"
      case "refund":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transaction Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Overview */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Badge className={getTypeColor(transaction.type)}>{transaction.type}</Badge>
                  <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                  {transaction.referenceType === "chat_transfer" && (
                    <Badge className="bg-purple-100 text-purple-800">Chat Transfer</Badge>
                  )}
                </div>
                <div className="text-right">
                  <TransactionAmount amount={transaction.amount} className="text-2xl font-bold" />
                  {transaction.feeAmount > 0 && (
                    <p className="text-sm text-gray-500">
                      Fee: <TransactionAmount amount={transaction.feeAmount} />
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Description:</span>
                  <span className="text-sm text-gray-700">{transaction.description}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Date:</span>
                  <span className="text-sm text-gray-700">{format(new Date(transaction.createdAt), "PPP 'at' p")}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Transaction ID:</span>
                  <span className="text-sm font-mono text-gray-700">{transaction.id}</span>
                </div>

                {transaction.referenceId && (
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Reference ID:</span>
                    <span className="text-sm font-mono text-gray-700">{transaction.referenceId}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Amount Breakdown */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Amount Breakdown
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Base Amount:</span>
                  <TransactionAmount amount={transaction.amount} />
                </div>
                {transaction.feeAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Processing Fee:</span>
                    <TransactionAmount amount={transaction.feeAmount} />
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Net Amount:</span>
                  <TransactionAmount amount={transaction.netAmount} />
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Balance Type:</span>
                  <span className="capitalize">{transaction.balanceType}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {(transaction.referenceType || transaction.status === "failed") && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Additional Information
                </h3>
                <div className="space-y-2">
                  {transaction.referenceType && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Reference Type:</span>
                      <span className="text-sm capitalize">{transaction.referenceType.replace("_", " ")}</span>
                    </div>
                  )}
                  {transaction.status === "failed" && (
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-sm text-red-800">
                        This transaction failed to process. Please contact support if you need assistance.
                      </p>
                    </div>
                  )}
                  {transaction.status === "pending" && (
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        This transaction is still being processed. It may take a few minutes to complete.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
