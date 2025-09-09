"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  CreditCard,
  Settings,
  DollarSign,
  TrendingUp,
  Wallet,
  Bitcoin,
  Banknote,
  Save,
  RefreshCw,
  CheckCircle,
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  Activity,
  BarChart3,
  Zap,
} from "lucide-react"

interface PaymentGateway {
  id: string
  name: string
  displayName: string
  type: "crypto" | "fiat" | "wallet" | "bank"
  logoUrl?: string
  isEnabled: boolean
  isDepositEnabled: boolean
  isWithdrawalEnabled: boolean
  depositFeePercentage: number
  depositFeeFixed: number
  withdrawalFeePercentage: number
  withdrawalFeeFixed: number
  minDepositAmount: number
  maxDepositAmount?: number
  minWithdrawalAmount: number
  maxWithdrawalAmount?: number
  processingTimeDeposit?: string
  processingTimeWithdrawal?: string
  supportedCurrencies: string[]
  isTestMode: boolean
  sortOrder: number
}

interface GatewayStats {
  totalTransactions: number
  totalVolume: number
  successRate: number
  avgProcessingTime: string
}

interface TransactionData {
  id: string
  gateway: string
  amount: number
  currency: string
  status: "pending" | "completed" | "failed" | "refunded"
  type: "deposit" | "withdrawal"
  user_email: string
  created_at: string
  reference_id: string
}

interface WebhookHealth {
  gateway: string
  last_success: string
  success_rate: number
  avg_response_time: number
  status: "healthy" | "warning" | "error"
}

interface FraudAlert {
  id: string
  type: "suspicious_amount" | "multiple_attempts" | "velocity_check"
  gateway: string
  user_email: string
  amount: number
  risk_score: number
  created_at: string
}

export default function PaymentMethodsPage() {
  const [gateways, setGateways] = useState<PaymentGateway[]>([])
  const [stats, setStats] = useState<Record<string, GatewayStats>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  const [transactions, setTransactions] = useState<TransactionData[]>([])
  const [webhookHealth, setWebhookHealth] = useState<WebhookHealth[]>([])
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState("7d")

  useEffect(() => {
    loadPaymentGateways()
    loadGatewayStats()
    loadTransactions()
    loadWebhookHealth()
    loadFraudAlerts()
  }, [])

  const loadPaymentGateways = async () => {
    try {
      const response = await fetch("/api/payments/gateways?admin=true")

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response")
      }

      const data = await response.json()

      if (data.success) {
        const transformedGateways: PaymentGateway[] = data.gateways.map((gateway: any) => ({
          id: gateway.id.toString(),
          name: gateway.name,
          displayName: gateway.display_name,
          type: gateway.type,
          logoUrl: `/payment-logos/${gateway.name}.png`,
          isEnabled: gateway.is_enabled,
          isDepositEnabled: gateway.deposit_enabled,
          isWithdrawalEnabled: gateway.withdrawal_enabled,
          depositFeePercentage: gateway.deposit_fee_percentage,
          depositFeeFixed: gateway.deposit_fee_fixed,
          withdrawalFeePercentage: gateway.withdrawal_fee_percentage,
          withdrawalFeeFixed: gateway.withdrawal_fee_fixed,
          minDepositAmount: gateway.min_deposit_amount,
          maxDepositAmount: gateway.max_deposit_amount,
          minWithdrawalAmount: gateway.min_withdrawal_amount,
          maxWithdrawalAmount: gateway.max_withdrawal_amount,
          processingTimeDeposit: gateway.processing_time_deposit || "Instant",
          processingTimeWithdrawal: gateway.processing_time_withdrawal || "1-3 business days",
          supportedCurrencies: gateway.supported_currencies || ["USD"],
          isTestMode: gateway.is_test_mode,
          sortOrder: gateway.sort_order,
        }))

        setGateways(transformedGateways)
      } else {
        throw new Error(data.error || "Failed to load gateways")
      }
    } catch (error) {
      console.error("Failed to load payment gateways:", error)
      toast.error("Failed to load payment gateways")
      setGateways([])
    } finally {
      setLoading(false)
    }
  }

  const loadGatewayStats = async () => {
    try {
      const response = await fetch("/api/admin/payment-stats")

      if (!response.ok) {
        if (response.status === 503) {
          const errorData = await response.json()
          console.error("Database setup required:", errorData.error)
          setStats({})
          return
        }
        console.error("Failed to load gateway stats: HTTP", response.status)
        return
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Gateway stats returned non-JSON response")
        return
      }

      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      } else {
        console.error("Gateway stats error:", data.error, data.details)
        setStats({})
      }
    } catch (error) {
      console.error("Failed to load gateway stats:", error)
      setStats({})
    }
  }

  const loadTransactions = async () => {
    try {
      const response = await fetch(
        `/api/admin/transactions?limit=50&search=${searchTerm}&status=${statusFilter}&range=${dateRange}`,
      )

      if (!response.ok) {
        console.error("Failed to load transactions: HTTP", response.status)
        return
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Transactions returned non-JSON response")
        return
      }

      const data = await response.json()
      setTransactions(data.transactions || [])
    } catch (error) {
      console.error("Failed to load transactions:", error)
      setTransactions([])
    }
  }

  const loadWebhookHealth = async () => {
    try {
      const response = await fetch("/api/admin/webhooks/health")

      if (!response.ok) {
        console.error("Failed to load webhook health: HTTP", response.status)
        return
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Webhook health returned non-JSON response")
        return
      }

      const data = await response.json()
      setWebhookHealth(data.health || [])
    } catch (error) {
      console.error("Failed to load webhook health:", error)
      setWebhookHealth([])
    }
  }

  const loadFraudAlerts = async () => {
    try {
      const response = await fetch("/api/admin/fraud-alerts?limit=10")

      if (!response.ok) {
        console.error("Failed to load fraud alerts: HTTP", response.status)
        return
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Fraud alerts returned non-JSON response")
        return
      }

      const data = await response.json()
      setFraudAlerts(data.alerts || [])
    } catch (error) {
      console.error("Failed to load fraud alerts:", error)
      setFraudAlerts([])
    }
  }

  const updateGateway = async (gateway: PaymentGateway) => {
    setSaving(gateway.id)
    try {
      const response = await fetch(`/api/admin/payment-gateways/${gateway.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_enabled: gateway.isEnabled,
          deposit_enabled: gateway.isDepositEnabled,
          withdrawal_enabled: gateway.isWithdrawalEnabled,
          deposit_fee_percentage: gateway.depositFeePercentage,
          deposit_fee_fixed: gateway.depositFeeFixed,
          withdrawal_fee_percentage: gateway.withdrawalFeePercentage,
          withdrawal_fee_fixed: gateway.withdrawalFeeFixed,
          min_deposit_amount: gateway.minDepositAmount,
          max_deposit_amount: gateway.maxDepositAmount,
          min_withdrawal_amount: gateway.minWithdrawalAmount,
          max_withdrawal_amount: gateway.maxWithdrawalAmount,
          is_test_mode: gateway.isTestMode,
          sort_order: gateway.sortOrder,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setGateways((prev) => prev.map((g) => (g.id === gateway.id ? gateway : g)))
        toast.success(`${gateway.displayName} settings updated successfully`)
      } else {
        throw new Error(data.error || "Update failed")
      }
    } catch (error) {
      console.error("Failed to update gateway:", error)
      toast.error("Failed to update gateway settings")
    } finally {
      setSaving(null)
    }
  }

  const exportTransactions = async () => {
    try {
      const response = await fetch(`/api/admin/transactions/export?range=${dateRange}`)

      if (!response.ok) {
        throw new Error("Export failed")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `transactions-${dateRange}.csv`
      a.click()
      toast.success("Transaction report exported successfully")
    } catch (error) {
      toast.error("Failed to export transactions")
    }
  }

  const handleRefund = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/admin/transactions/${transactionId}/refund`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Refund failed")
      }

      const data = await response.json()
      if (data.success) {
        toast.success("Refund initiated successfully")
        loadTransactions()
      } else {
        throw new Error(data.error || "Refund failed")
      }
    } catch (error) {
      toast.error("Failed to initiate refund")
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "crypto":
        return <Bitcoin className="h-4 w-4" />
      case "fiat":
        return <DollarSign className="h-4 w-4" />
      case "wallet":
        return <Wallet className="h-4 w-4" />
      case "bank":
        return <Banknote className="h-4 w-4" />
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
      case "bank":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-600">Manage payment gateways, fees, and settings</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportTransactions} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={loadPaymentGateways} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Gateways</p>
                <p className="text-2xl font-bold text-green-600">{gateways.filter((g) => g.isEnabled).length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Volume</p>
                <p className="text-2xl font-bold text-blue-600">
                  $
                  {Object.values(stats)
                    .reduce((sum, s) => sum + s.totalVolume, 0)
                    .toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Object.values(stats)
                    .reduce((sum, s) => sum + s.totalTransactions, 0)
                    .toLocaleString()}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Success Rate</p>
                <p className="text-2xl font-bold text-orange-600">
                  {(
                    Object.values(stats).reduce((sum, s) => sum + s.successRate, 0) / Object.values(stats).length || 0
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fraud Alerts</p>
                <p className="text-2xl font-bold text-red-600">{fraudAlerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Gateway Settings</TabsTrigger>
          <TabsTrigger value="fees">Fee Management</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Health</TabsTrigger>
          <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {gateways.map((gateway) => (
              <Card
                key={gateway.id}
                className={`${gateway.isEnabled ? "border-green-200 bg-green-50" : "border-gray-200"}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border">
                        {getTypeIcon(gateway.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{gateway.displayName}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className={getTypeColor(gateway.type)}>
                            {gateway.type}
                          </Badge>
                          {gateway.isTestMode && (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                              Test Mode
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={gateway.isEnabled}
                      onCheckedChange={(checked) => {
                        const updated = { ...gateway, isEnabled: checked }
                        updateGateway(updated)
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Deposits</p>
                      <p className={`font-medium ${gateway.isDepositEnabled ? "text-green-600" : "text-red-600"}`}>
                        {gateway.isDepositEnabled ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Withdrawals</p>
                      <p className={`font-medium ${gateway.isWithdrawalEnabled ? "text-green-600" : "text-red-600"}`}>
                        {gateway.isWithdrawalEnabled ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                  </div>

                  {stats[gateway.name] && (
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Transactions:</span>
                        <span className="font-medium">{stats[gateway.name].totalTransactions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Volume:</span>
                        <span className="font-medium">${stats[gateway.name].totalVolume.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="font-medium text-green-600">{stats[gateway.name].successRate}%</span>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={() => {
                      setSelectedGateway(gateway)
                      setActiveTab("settings")
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {selectedGateway ? (
            <Card>
              <CardHeader>
                <CardTitle>Configure {selectedGateway.displayName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enabled">Gateway Enabled</Label>
                      <Switch
                        id="enabled"
                        checked={selectedGateway.isEnabled}
                        onCheckedChange={(checked) => {
                          setSelectedGateway({ ...selectedGateway, isEnabled: checked })
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="deposit-enabled">Deposits Enabled</Label>
                      <Switch
                        id="deposit-enabled"
                        checked={selectedGateway.isDepositEnabled}
                        onCheckedChange={(checked) => {
                          setSelectedGateway({ ...selectedGateway, isDepositEnabled: checked })
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="withdrawal-enabled">Withdrawals Enabled</Label>
                      <Switch
                        id="withdrawal-enabled"
                        checked={selectedGateway.isWithdrawalEnabled}
                        onCheckedChange={(checked) => {
                          setSelectedGateway({ ...selectedGateway, isWithdrawalEnabled: checked })
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="test-mode">Test Mode</Label>
                      <Switch
                        id="test-mode"
                        checked={selectedGateway.isTestMode}
                        onCheckedChange={(checked) => {
                          setSelectedGateway({ ...selectedGateway, isTestMode: checked })
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="min-deposit">Minimum Deposit ($)</Label>
                      <Input
                        id="min-deposit"
                        type="number"
                        step="0.01"
                        value={selectedGateway.minDepositAmount}
                        onChange={(e) => {
                          setSelectedGateway({
                            ...selectedGateway,
                            minDepositAmount: Number.parseFloat(e.target.value) || 0,
                          })
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor="max-deposit">Maximum Deposit ($)</Label>
                      <Input
                        id="max-deposit"
                        type="number"
                        step="0.01"
                        value={selectedGateway.maxDepositAmount || ""}
                        onChange={(e) => {
                          setSelectedGateway({
                            ...selectedGateway,
                            maxDepositAmount: Number.parseFloat(e.target.value) || undefined,
                          })
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor="min-withdrawal">Minimum Withdrawal ($)</Label>
                      <Input
                        id="min-withdrawal"
                        type="number"
                        step="0.01"
                        value={selectedGateway.minWithdrawalAmount}
                        onChange={(e) => {
                          setSelectedGateway({
                            ...selectedGateway,
                            minWithdrawalAmount: Number.parseFloat(e.target.value) || 0,
                          })
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor="max-withdrawal">Maximum Withdrawal ($)</Label>
                      <Input
                        id="max-withdrawal"
                        type="number"
                        step="0.01"
                        value={selectedGateway.maxWithdrawalAmount || ""}
                        onChange={(e) => {
                          setSelectedGateway({
                            ...selectedGateway,
                            maxWithdrawalAmount: Number.parseFloat(e.target.value) || undefined,
                          })
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setSelectedGateway(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => updateGateway(selectedGateway)} disabled={saving === selectedGateway.id}>
                    {saving === selectedGateway.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Gateway</h3>
                <p className="text-gray-600">
                  Choose a payment gateway from the overview tab to configure its settings.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {gateways.map((gateway) => (
              <Card key={gateway.id}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getTypeIcon(gateway.type)}
                    <span>{gateway.displayName}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`deposit-fee-${gateway.id}`}>Deposit Fee (%)</Label>
                      <Input
                        id={`deposit-fee-${gateway.id}`}
                        type="number"
                        step="0.01"
                        value={gateway.depositFeePercentage}
                        onChange={(e) => {
                          const updated = { ...gateway, depositFeePercentage: Number.parseFloat(e.target.value) || 0 }
                          setGateways((prev) => prev.map((g) => (g.id === gateway.id ? updated : g)))
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`deposit-fixed-${gateway.id}`}>Deposit Fixed Fee ($)</Label>
                      <Input
                        id={`deposit-fixed-${gateway.id}`}
                        type="number"
                        step="0.01"
                        value={gateway.depositFeeFixed}
                        onChange={(e) => {
                          const updated = { ...gateway, depositFeeFixed: Number.parseFloat(e.target.value) || 0 }
                          setGateways((prev) => prev.map((g) => (g.id === gateway.id ? updated : g)))
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`withdrawal-fee-${gateway.id}`}>Withdrawal Fee (%)</Label>
                      <Input
                        id={`withdrawal-fee-${gateway.id}`}
                        type="number"
                        step="0.01"
                        value={gateway.withdrawalFeePercentage}
                        onChange={(e) => {
                          const updated = {
                            ...gateway,
                            withdrawalFeePercentage: Number.parseFloat(e.target.value) || 0,
                          }
                          setGateways((prev) => prev.map((g) => (g.id === gateway.id ? updated : g)))
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`withdrawal-fixed-${gateway.id}`}>Withdrawal Fixed Fee ($)</Label>
                      <Input
                        id={`withdrawal-fixed-${gateway.id}`}
                        type="number"
                        step="0.01"
                        value={gateway.withdrawalFeeFixed}
                        onChange={(e) => {
                          const updated = { ...gateway, withdrawalFeeFixed: Number.parseFloat(e.target.value) || 0 }
                          setGateways((prev) => prev.map((g) => (g.id === gateway.id ? updated : g)))
                        }}
                      />
                    </div>
                  </div>

                  <Button onClick={() => updateGateway(gateway)} disabled={saving === gateway.id} className="w-full">
                    {saving === gateway.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update Fees
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Today</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadTransactions}>
              <Filter className="mr-2 h-4 w-4" />
              Apply
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gateway</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-sm">{transaction.reference_id}</p>
                            <p className="text-xs text-gray-500">{transaction.type}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{transaction.gateway}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">{transaction.user_email}</td>
                        <td className="px-4 py-3">
                          <span className="font-medium">
                            {transaction.amount} {transaction.currency}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              transaction.status === "completed"
                                ? "default"
                                : transaction.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {transaction.status === "completed" && (
                              <Button size="sm" variant="ghost" onClick={() => handleRefund(transaction.id)}>
                                Refund
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {webhookHealth.map((health) => (
              <Card key={health.gateway}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{health.gateway}</CardTitle>
                    <Badge
                      variant={
                        health.status === "healthy"
                          ? "default"
                          : health.status === "warning"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {health.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-medium">{health.success_rate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Response:</span>
                    <span className="font-medium">{health.avg_response_time}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Success:</span>
                    <span className="font-medium">{health.last_success}</span>
                  </div>
                  <div className="pt-2">
                    <Button size="sm" variant="outline" className="w-full bg-transparent">
                      <Zap className="mr-2 h-4 w-4" />
                      Test Webhook
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fraud" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Fraud Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fraudAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium">{alert.type.replace("_", " ").toUpperCase()}</p>
                        <p className="text-sm text-gray-600">
                          {alert.user_email} - {alert.gateway} - ${alert.amount}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Risk: {alert.risk_score}/100</Badge>
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
