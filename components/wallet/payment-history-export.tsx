"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Download, FileText, Table } from "lucide-react"
import { format } from "date-fns"
import type { WalletTransaction } from "@/lib/wallet"

interface PaymentHistoryExportProps {
  transactions: WalletTransaction[]
  dateRange?: { from: Date; to: Date }
}

export function PaymentHistoryExport({ transactions, dateRange }: PaymentHistoryExportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv")
  const [includeFields, setIncludeFields] = useState({
    id: true,
    date: true,
    type: true,
    amount: true,
    status: true,
    description: true,
    reference: false,
    fees: false,
  })

  const exportToCSV = () => {
    const headers = []
    const fields = []

    if (includeFields.id) {
      headers.push("Transaction ID")
      fields.push("id")
    }
    if (includeFields.date) {
      headers.push("Date")
      fields.push("createdAt")
    }
    if (includeFields.type) {
      headers.push("Type")
      fields.push("type")
    }
    if (includeFields.amount) {
      headers.push("Amount")
      fields.push("amount")
    }
    if (includeFields.status) {
      headers.push("Status")
      fields.push("status")
    }
    if (includeFields.description) {
      headers.push("Description")
      fields.push("description")
    }
    if (includeFields.reference) {
      headers.push("Reference ID")
      fields.push("referenceId")
    }
    if (includeFields.fees) {
      headers.push("Fee Amount")
      fields.push("feeAmount")
    }

    const csvContent = [
      headers.join(","),
      ...transactions.map((transaction) =>
        fields
          .map((field) => {
            let value = transaction[field as keyof WalletTransaction]
            if (field === "createdAt") {
              value = format(new Date(value as string), "yyyy-MM-dd HH:mm:ss")
            }
            if (field === "description") {
              value = `"${(value as string).replace(/"/g, '""')}"`
            }
            return value || ""
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url

    const dateStr = dateRange
      ? `${format(dateRange.from, "yyyy-MM-dd")}_to_${format(dateRange.to, "yyyy-MM-dd")}`
      : format(new Date(), "yyyy-MM-dd")

    a.download = `payment-history_${dateStr}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    setIsOpen(false)
  }

  const exportToPDF = async () => {
    // Create a simple HTML table for PDF generation
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment History Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .amount-positive { color: #16a34a; }
            .amount-negative { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1>Payment History Report</h1>
          <p>Generated on: ${format(new Date(), "PPP")}</p>
          ${dateRange ? `<p>Period: ${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}</p>` : ""}
          <p>Total Transactions: ${transactions.length}</p>
          
          <table>
            <thead>
              <tr>
                ${includeFields.date ? "<th>Date</th>" : ""}
                ${includeFields.type ? "<th>Type</th>" : ""}
                ${includeFields.amount ? "<th>Amount</th>" : ""}
                ${includeFields.status ? "<th>Status</th>" : ""}
                ${includeFields.description ? "<th>Description</th>" : ""}
              </tr>
            </thead>
            <tbody>
              ${transactions
                .map(
                  (transaction) => `
                <tr>
                  ${includeFields.date ? `<td>${format(new Date(transaction.createdAt), "MMM dd, yyyy")}</td>` : ""}
                  ${includeFields.type ? `<td>${transaction.type}</td>` : ""}
                  ${includeFields.amount ? `<td class="${transaction.amount >= 0 ? "amount-positive" : "amount-negative"}">$${Math.abs(transaction.amount).toFixed(2)}</td>` : ""}
                  ${includeFields.status ? `<td>${transaction.status}</td>` : ""}
                  ${includeFields.description ? `<td>${transaction.description}</td>` : ""}
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.print()
    }
    setIsOpen(false)
  }

  const handleExport = () => {
    if (exportFormat === "csv") {
      exportToCSV()
    } else {
      exportToPDF()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Payment History</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="format">Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: "csv" | "pdf") => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    CSV (Excel)
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF Report
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Include Fields</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {Object.entries(includeFields).map(([field, checked]) => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox
                    id={field}
                    checked={checked}
                    onCheckedChange={(checked) => setIncludeFields((prev) => ({ ...prev, [field]: !!checked }))}
                  />
                  <Label htmlFor={field} className="text-sm capitalize">
                    {field === "id" ? "Transaction ID" : field}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <p className="text-sm text-gray-600">{transactions.length} transactions</p>
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export {exportFormat.toUpperCase()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
