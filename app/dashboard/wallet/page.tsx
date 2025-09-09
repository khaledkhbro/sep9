"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TransactionItem } from "@/components/wallet/transaction-item"
import { EnhancedDepositDialog } from "@/components/wallet/deposit-dialog"
import { WithdrawalDialog } from "@/components/wallet/withdrawal-dialog"
import { WalletBalance } from "@/components/ui/price-display"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import {
  getWallet,
  getTransactions,
  getPaymentMethods,
  getUpcomingPayments,
  getPendingPayments,
  addWalletTransaction,
  type Wallet,
  type WalletTransaction,
  type PaymentMethod,
  type PaymentSchedule,
} from "@/lib/wallet"
import {
  getUserCoinData,
  getCoinSystemSettings,
  cashoutCoins,
  type UserCoinData,
  type CoinSystemSettings,
} from "@/lib/coin-system"
import {
  WalletIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Banknote,
  Calendar,
  AlertCircle,
  Coins,
  Sparkles,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { PaymentHistoryExport } from "@/components/wallet/payment-history-export"
import { TransactionDetailsDialog } from "@/components/wallet/transaction-details-dialog"
import { PaymentReceiptDialog } from "@/components/wallet/payment-receipt-dialog"
import { Search, Eye, Receipt } from "lucide-react"
import { subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"

export default function WalletPage() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [upcomingPayments, setUpcomingPayments] = useState<PaymentSchedule[]>([])
  const [pendingPayments, setPendingPayments] = useState<WalletTransaction[]>([])
  const [coinData, setCoinData] = useState<UserCoinData | null>(null)
  const [coinSettings, setCoinSettings] = useState<CoinSystemSettings | null>(null)
  const [cashingOutCoins, setCashingOutCoins] = useState(false)
  const [loading, setLoading] = useState(true)
  const [transactionFilter, setTransactionFilter] = useState<string>("all")

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>()
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null)
  const [showTransactionDetails, setShowTransactionDetails] = useState(false)
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [sortBy, setSortBy] = useState<"date" | "amount">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    if (user?.id) {
      loadWalletData()
    }
  }, [user?.id])

  const loadWalletData = async () => {
    if (!user?.id) {
      console.log("[v0] No user ID available for wallet loading")
      setLoading(false)
      return
    }

    console.log("[v0] Loading wallet data for user:", user.id)
    setLoading(true)
    try {
      const [
        walletData,
        transactionsData,
        paymentMethodsData,
        upcomingData,
        pendingData,
        coinUserData,
        coinSystemSettings,
      ] = await Promise.all([
        getWallet(user.id),
        getTransactions(`wallet_${user.id}`),
        getPaymentMethods(user.id),
        getUpcomingPayments(user.id),
        getPendingPayments(user.id),
        getUserCoinData(user.id),
        getCoinSystemSettings(),
      ])

      console.log("[v0] Loaded wallet data:", walletData)
      setWallet(walletData)
      setTransactions(transactionsData)
      setPaymentMethods(paymentMethodsData)
      setUpcomingPayments(upcomingData)
      setPendingPayments(pendingData)
      setCoinData(coinUserData)
      setCoinSettings(coinSystemSettings)
    } catch (error) {
      console.error("[v0] Failed to load wallet data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCoinCashout = async () => {
    if (!user?.id || !coinData || !coinSettings) return

    if (coinData.availableCoins < coinSettings.minCashoutCoins) {
      toast.error(`Minimum cashout is ${coinSettings.minCashoutCoins} coins`)
      return
    }

    setCashingOutCoins(true)
    try {
      const cashout = await cashoutCoins(user.id, coinData.availableCoins)

      // Add to wallet as earnings
      await addWalletTransaction({
        userId: user.id,
        type: "earning",
        amount: cashout.netAmount,
        description: `Coin cashout: ${cashout.coinsAmount} coins`,
        referenceId: cashout.id,
        referenceType: "coin_cashout",
      })

      toast.success(`Successfully cashed out ${cashout.coinsAmount} coins for $${cashout.netAmount.toFixed(2)}!`)
      loadWalletData()
    } catch (error) {
      console.error("Failed to cashout coins:", error)
      toast.error("Failed to cashout coins")
    } finally {
      setCashingOutCoins(false)
    }
  }

  const filteredTransactions = transactions
    .filter((transaction) => {
      // Type filter
      if (transactionFilter !== "all") {
        if (transactionFilter === "chat" && transaction.referenceType !== "chat_transfer") return false
        if (transactionFilter !== "chat" && transaction.type !== transactionFilter) return false
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesSearch =
          transaction.description.toLowerCase().includes(search) ||
          transaction.referenceId?.toLowerCase().includes(search) ||
          transaction.id.toLowerCase().includes(search)
        if (!matchesSearch) return false
      }

      // Status filter
      if (statusFilter !== "all" && transaction.status !== statusFilter) return false

      // Date range filter
      if (dateRange?.from && dateRange?.to) {
        const transactionDate = new Date(transaction.createdAt)
        if (transactionDate < dateRange.from || transactionDate > dateRange.to) return false
      }

      return true
    })
    .sort((a, b) => {
      let comparison = 0

      if (sortBy === "date") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else if (sortBy === "amount") {
        comparison = Math.abs(a.amount) - Math.abs(b.amount)
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

  const transactionStats = {
    totalIncome: filteredTransactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: filteredTransactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
    totalTransactions: filteredTransactions.length,
    avgTransactionAmount:
      filteredTransactions.length > 0
        ? filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / filteredTransactions.length
        : 0,
  }

  const setQuickDateRange = (preset: string) => {
    const now = new Date()
    switch (preset) {
      case "today":
        setDateRange({ from: now, to: now })
        break
      case "week":
        setDateRange({ from: subDays(now, 7), to: now })
        break
      case "month":
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) })
        break
      case "year":
        setDateRange({ from: startOfYear(now), to: endOfYear(now) })
        break
      case "all":
        setDateRange(undefined)
        break
    }
  }

  const handleTransactionClick = (transaction: WalletTransaction) => {
    setSelectedTransaction(transaction)
    setShowTransactionDetails(true)
  }

  const handleShowReceipt = (transaction: WalletTransaction) => {
    setSelectedTransaction(transaction)
    setShowReceiptDialog(true)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!wallet) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Failed to load wallet data</p>
      </div>
    )
  }

  return (
    <>
      <DashboardHeader title="Wallet" description="Manage your funds, view transactions, and handle payments" />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Balance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Deposit Balance</p>
                    <p className="text-xl text-blue-800">
                      <WalletBalance amount={wallet.depositBalance || 0} />
                    </p>
                    <p className="text-xs text-blue-600 mt-1">Cannot withdraw</p>
                  </div>
                  <Banknote className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Earnings Balance</p>
                    <p className="text-xl text-green-800">
                      <WalletBalance amount={wallet.earningsBalance || 0} />
                    </p>
                    <p className="text-xs text-green-600 mt-1">Available to withdraw</p>
                  </div>
                  <WalletIcon className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>

            {coinSettings?.isEnabled && coinData && (
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-100 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-700 font-medium">Coin Balance</p>
                      <p className="text-xl text-yellow-800">{coinData.availableCoins.toLocaleString()}</p>
                      <p className="text-xs text-yellow-600 mt-1">
                        ${(coinData.availableCoins * coinSettings.coinToUsdRate).toFixed(4)} USD
                      </p>
                    </div>
                    <Coins className="h-6 w-6 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Earned</p>
                    <p className="text-xl font-bold text-blue-600">
                      <WalletBalance amount={wallet.totalEarned || 0} />
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="text-xl font-bold text-red-600">
                      <WalletBalance amount={wallet.totalSpent || 0} />
                    </p>
                  </div>
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Upcoming Payments</p>
                    <p className="text-xl font-bold text-purple-600">
                      <WalletBalance amount={wallet.upcomingPayments || 0} />
                    </p>
                  </div>
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Payments</p>
                    <p className="text-xl font-bold text-orange-600">
                      <WalletBalance amount={wallet.pendingPayments || 0} />
                    </p>
                  </div>
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {coinSettings?.isEnabled && coinData && coinData.availableCoins >= coinSettings.minCashoutCoins && (
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Coin Cashout Available
                    </h3>
                    <p className="text-yellow-600 text-sm mb-1">
                      You have {coinData.availableCoins.toLocaleString()} coins ready to cash out
                    </p>
                    <p className="text-yellow-500 text-xs">
                      Cash out value: ${(coinData.availableCoins * coinSettings.coinToUsdRate).toFixed(2)}
                      {coinSettings.cashoutFeePercentage > 0 && (
                        <span className="text-orange-600">
                          {" "}
                          ($
                          {(
                            coinData.availableCoins *
                            coinSettings.coinToUsdRate *
                            (1 - coinSettings.cashoutFeePercentage / 100)
                          ).toFixed(2)}{" "}
                          after {coinSettings.cashoutFeePercentage}% fee)
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    onClick={handleCoinCashout}
                    disabled={cashingOutCoins}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    {cashingOutCoins ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Coins className="mr-2 h-4 w-4" />
                        Cash Out Coins
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {(upcomingPayments.length > 0 || pendingPayments.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {upcomingPayments.length > 0 && (
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-purple-800 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Upcoming Payments ({upcomingPayments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {upcomingPayments.slice(0, 3).map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center text-sm">
                        <span className="text-purple-700">{payment.description}</span>
                        <div className="text-right">
                          <div className="font-semibold text-purple-800">
                            <WalletBalance amount={payment.amount} />
                          </div>
                          <div className="text-purple-600">{new Date(payment.scheduledDate).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                    {upcomingPayments.length > 3 && (
                      <p className="text-purple-600 text-xs">+{upcomingPayments.length - 3} more payments</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {pendingPayments.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-orange-800 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Pending Payments ({pendingPayments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pendingPayments.slice(0, 3).map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center text-sm">
                        <span className="text-orange-700">{payment.description}</span>
                        <div className="text-right">
                          <div className="font-semibold text-orange-800">
                            <WalletBalance amount={Math.abs(payment.amount)} />
                          </div>
                          <div className="text-orange-600">{new Date(payment.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                    {pendingPayments.length > 3 && (
                      <p className="text-orange-600 text-xs">+{pendingPayments.length - 3} more payments</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <EnhancedDepositDialog onSuccess={loadWalletData} />
                <WithdrawalDialog wallet={wallet} paymentMethods={paymentMethods} onSuccess={loadWalletData} />
                {coinSettings?.isEnabled && (
                  <Button
                    variant="outline"
                    className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                    asChild
                  >
                    <a href="/dashboard/coins">
                      <Coins className="mr-2 h-4 w-4" />
                      Collect Daily Coins
                    </a>
                  </Button>
                )}
                <Button variant="outline" className="bg-transparent">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payment Methods
                </Button>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>Only earnings balance can be withdrawn</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payment History</CardTitle>
                <div className="flex gap-2">
                  <PaymentHistoryExport transactions={filteredTransactions} dateRange={dateRange} />
                  <Button variant="outline" size="sm" onClick={() => setDateRange(undefined)}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                {/* Search and Quick Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search transactions, descriptions, or IDs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={(value: "date" | "amount") => setSortBy(value)}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    {sortOrder === "asc" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Date Range and Quick Presets */}
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <DatePickerWithRange date={dateRange} onDateChange={setDateRange} className="w-full sm:w-auto" />
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => setQuickDateRange("today")}>
                      Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setQuickDateRange("week")}>
                      This Week
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setQuickDateRange("month")}>
                      This Month
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setQuickDateRange("year")}>
                      This Year
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setQuickDateRange("all")}>
                      All Time
                    </Button>
                  </div>
                </div>

                {/* Transaction Statistics */}
                {filteredTransactions.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Income</p>
                      <p className="text-lg font-semibold text-green-600">
                        <WalletBalance amount={transactionStats.totalIncome} />
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Expenses</p>
                      <p className="text-lg font-semibold text-red-600">
                        <WalletBalance amount={transactionStats.totalExpenses} />
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Transactions</p>
                      <p className="text-lg font-semibold text-blue-600">{transactionStats.totalTransactions}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Avg Amount</p>
                      <p className="text-lg font-semibold text-purple-600">
                        <WalletBalance amount={transactionStats.avgTransactionAmount} />
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Tabs value={transactionFilter} onValueChange={setTransactionFilter} className="space-y-4">
                <TabsList>
                  <TabsTrigger value="all">All Transactions</TabsTrigger>
                  <TabsTrigger value="earning">Earnings</TabsTrigger>
                  <TabsTrigger value="payment">Payments</TabsTrigger>
                  <TabsTrigger value="deposit">Deposits</TabsTrigger>
                  <TabsTrigger value="withdrawal">Withdrawals</TabsTrigger>
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                </TabsList>

                <TabsContent value={transactionFilter} className="space-y-4">
                  {filteredTransactions.length > 0 ? (
                    <div className="space-y-3">
                      {filteredTransactions.map((transaction) => (
                        <div key={transaction.id} className="relative group">
                          <TransactionItem transaction={transaction} />
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="ghost" onClick={() => handleTransactionClick(transaction)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {transaction.status === "completed" && (
                              <Button size="sm" variant="ghost" onClick={() => handleShowReceipt(transaction)}>
                                <Receipt className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                      <p className="text-gray-600">
                        {searchTerm || statusFilter !== "all" || dateRange
                          ? "No transactions match your current filters."
                          : transactionFilter === "all"
                            ? "You haven't made any transactions yet."
                            : transactionFilter === "chat"
                              ? "No chat transfers found."
                              : `No ${transactionFilter} transactions found.`}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedTransaction && (
        <>
          <TransactionDetailsDialog
            transaction={selectedTransaction}
            isOpen={showTransactionDetails}
            onClose={() => {
              setShowTransactionDetails(false)
              setSelectedTransaction(null)
            }}
          />
          <PaymentReceiptDialog
            transaction={selectedTransaction}
            isOpen={showReceiptDialog}
            onClose={() => {
              setShowReceiptDialog(false)
              setSelectedTransaction(null)
            }}
          />
        </>
      )}
    </>
  )
}
