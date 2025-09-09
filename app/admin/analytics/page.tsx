"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { getPlatformMetrics, type PlatformMetrics } from "@/lib/admin"
import {
  Users,
  DollarSign,
  Briefcase,
  Download,
  Calendar,
  UserPlus,
  LogIn,
  Activity,
  Wallet,
  ArrowUpDown,
  Star,
  Target,
  Trophy,
  Coins,
  RefreshCw,
} from "lucide-react"

const COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#6366F1",
]

// Mock data - replace with real API calls
const mockAnalytics = {
  userStats: {
    todaySignups: 45,
    todayLogins: 1234,
    dailyActiveUsers: 892,
    weeklySignups: 312,
    monthlySignups: 1456,
    yearlySignups: 18234,
  },
  financialStats: {
    todayDeposits: 12450,
    todayWithdrawals: 8930,
    todayEarnings: 3520,
    weeklyDeposits: 89340,
    weeklyWithdrawals: 67230,
    weeklyEarnings: 22110,
    monthlyDeposits: 345600,
    monthlyWithdrawals: 267800,
    monthlyEarnings: 77800,
    yearlyDeposits: 4567800,
    yearlyWithdrawals: 3456700,
    yearlyEarnings: 1111100,
  },
  marketplaceStats: {
    topGigs: [
      { name: "Logo Design", orders: 234, revenue: 45600 },
      { name: "Website Development", orders: 189, revenue: 78900 },
      { name: "Content Writing", orders: 156, revenue: 23400 },
      { name: "Social Media Management", orders: 134, revenue: 34500 },
      { name: "Video Editing", orders: 98, revenue: 56700 },
    ],
    categoryPerformance: [
      {
        category: "Design & Creative",
        subCategory: "Logo Design",
        microCategory: "Business Logo",
        orders: 145,
        revenue: 28900,
      },
      {
        category: "Technology",
        subCategory: "Web Development",
        microCategory: "E-commerce Sites",
        orders: 89,
        revenue: 45600,
      },
      {
        category: "Writing & Translation",
        subCategory: "Content Writing",
        microCategory: "Blog Posts",
        orders: 67,
        revenue: 12300,
      },
      {
        category: "Digital Marketing",
        subCategory: "SEO",
        microCategory: "Keyword Research",
        orders: 56,
        revenue: 8900,
      },
      {
        category: "Video & Animation",
        subCategory: "Video Editing",
        microCategory: "YouTube Videos",
        orders: 45,
        revenue: 15600,
      },
    ],
  },
  referralStats: {
    totalReferrals: 2345,
    todayEarnings: 567,
    weeklyEarnings: 3456,
    monthlyEarnings: 12890,
    yearlyEarnings: 156780,
    allTimeEarnings: 567890,
  },
  jobStats: {
    todayPosts: 23,
    weeklyPosts: 167,
    monthlyPosts: 678,
    yearlyPosts: 8234,
    todaySpent: 4567,
    weeklySpent: 34567,
    monthlySpent: 145678,
    yearlySpent: 1789456,
  },
  platformRevenue: {
    todayFees: 890,
    weeklyFees: 6789,
    monthlyFees: 28900,
    yearlyFees: 345600,
    totalProfit: 2345678,
  },
}

export default function AdminAnalyticsPage() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")
  const [activeTab, setActiveTab] = useState("overview")
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | undefined>()
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadAnalytics()
  }, [timeRange, customDateRange])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const metricsData = await getPlatformMetrics()
      setMetrics(metricsData)
    } catch (error) {
      console.error("Failed to load analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    const dataToExport = {
      userStats: mockAnalytics.userStats,
      financialStats: mockAnalytics.financialStats,
      marketplaceStats: mockAnalytics.marketplaceStats,
      referralStats: mockAnalytics.referralStats,
      jobStats: mockAnalytics.jobStats,
      platformRevenue: mockAnalytics.platformRevenue,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-export-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <>
        <AdminHeader title="Comprehensive Analytics" description="Complete platform performance and insights" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <AdminHeader title="Comprehensive Analytics" description="Complete platform performance and insights" />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {timeRange === "custom" && (
                <DatePickerWithRange date={customDateRange} onDateChange={setCustomDateRange} />
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportData} className="bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button onClick={loadAnalytics}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Analytics Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-700">Today Signups</CardTitle>
                    <UserPlus className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900">{mockAnalytics.userStats.todaySignups}</div>
                    <p className="text-xs text-blue-600">New users today</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-700">Today Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900">
                      ${mockAnalytics.financialStats.todayEarnings.toLocaleString()}
                    </div>
                    <p className="text-xs text-green-600">Platform earnings</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-purple-700">Active Users</CardTitle>
                    <Activity className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-900">
                      {mockAnalytics.userStats.dailyActiveUsers.toLocaleString()}
                    </div>
                    <p className="text-xs text-purple-600">Daily active users</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-orange-700">Platform Fees</CardTitle>
                    <Coins className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-900">
                      ${mockAnalytics.platformRevenue.todayFees.toLocaleString()}
                    </div>
                    <p className="text-xs text-orange-600">Today's profit</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      User Activity Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Today Logins</span>
                      <Badge variant="secondary">{mockAnalytics.userStats.todayLogins.toLocaleString()}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Weekly Signups</span>
                      <Badge variant="secondary">{mockAnalytics.userStats.weeklySignups.toLocaleString()}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Monthly Signups</span>
                      <Badge variant="secondary">{mockAnalytics.userStats.monthlySignups.toLocaleString()}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Financial Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Today Deposits</span>
                      <Badge className="bg-green-100 text-green-800">
                        ${mockAnalytics.financialStats.todayDeposits.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Today Withdrawals</span>
                      <Badge className="bg-red-100 text-red-800">
                        ${mockAnalytics.financialStats.todayWithdrawals.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Monthly Revenue</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        ${mockAnalytics.financialStats.monthlyEarnings.toLocaleString()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-purple-600" />
                      Platform Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Referrals</span>
                      <Badge variant="secondary">{mockAnalytics.referralStats.totalReferrals.toLocaleString()}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Today Job Posts</span>
                      <Badge variant="secondary">{mockAnalytics.jobStats.todayPosts}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Profit</span>
                      <Badge className="bg-purple-100 text-purple-800">
                        ${(mockAnalytics.platformRevenue.totalProfit / 1000).toFixed(0)}K
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Today Signups
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900">{mockAnalytics.userStats.todaySignups}</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      Today Logins
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900">
                      {mockAnalytics.userStats.todayLogins.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Daily Active
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-900">
                      {mockAnalytics.userStats.dailyActiveUsers.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Yearly Signups
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-900">
                      {mockAnalytics.userStats.yearlySignups.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">Weekly Signups</span>
                        <Badge className="bg-blue-100 text-blue-800">{mockAnalytics.userStats.weeklySignups}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">Monthly Signups</span>
                        <Badge className="bg-green-100 text-green-800">
                          {mockAnalytics.userStats.monthlySignups.toLocaleString()}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">Yearly Signups</span>
                        <Badge className="bg-purple-100 text-purple-800">
                          {mockAnalytics.userStats.yearlySignups.toLocaleString()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Activity Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Login Rate</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: "78%" }}></div>
                          </div>
                          <span className="text-sm font-medium">78%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Daily Active Rate</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: "65%" }}></div>
                          </div>
                          <span className="text-sm font-medium">65%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Retention Rate</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full" style={{ width: "82%" }}></div>
                          </div>
                          <span className="text-sm font-medium">82%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Today Deposits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900">
                      ${mockAnalytics.financialStats.todayDeposits.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Today Withdrawals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-900">
                      ${mockAnalytics.financialStats.todayWithdrawals.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Today Earnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900">
                      ${mockAnalytics.financialStats.todayEarnings.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Breakdown by Period</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          period: "Weekly",
                          deposits: mockAnalytics.financialStats.weeklyDeposits,
                          withdrawals: mockAnalytics.financialStats.weeklyWithdrawals,
                          earnings: mockAnalytics.financialStats.weeklyEarnings,
                        },
                        {
                          period: "Monthly",
                          deposits: mockAnalytics.financialStats.monthlyDeposits,
                          withdrawals: mockAnalytics.financialStats.monthlyWithdrawals,
                          earnings: mockAnalytics.financialStats.monthlyEarnings,
                        },
                        {
                          period: "Yearly",
                          deposits: mockAnalytics.financialStats.yearlyDeposits,
                          withdrawals: mockAnalytics.financialStats.yearlyWithdrawals,
                          earnings: mockAnalytics.financialStats.yearlyEarnings,
                        },
                      ].map((item) => (
                        <div key={item.period} className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-3">{item.period}</h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Deposits</span>
                              <div className="font-semibold text-green-600">${item.deposits.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Withdrawals</span>
                              <div className="font-semibold text-red-600">${item.withdrawals.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Earnings</span>
                              <div className="font-semibold text-blue-600">${item.earnings.toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Platform Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="font-medium">Today Fees</span>
                        <Badge className="bg-green-100 text-green-800">
                          ${mockAnalytics.platformRevenue.todayFees}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium">Weekly Fees</span>
                        <Badge className="bg-blue-100 text-blue-800">
                          ${mockAnalytics.platformRevenue.weeklyFees.toLocaleString()}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span className="font-medium">Monthly Fees</span>
                        <Badge className="bg-purple-100 text-purple-800">
                          ${mockAnalytics.platformRevenue.monthlyFees.toLocaleString()}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span className="font-medium">Yearly Fees</span>
                        <Badge className="bg-orange-100 text-orange-800">
                          ${mockAnalytics.platformRevenue.yearlyFees.toLocaleString()}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
                        <span className="font-bold">Total Profit</span>
                        <Badge className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
                          ${(mockAnalytics.platformRevenue.totalProfit / 1000).toFixed(0)}K
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Marketplace Tab */}
            <TabsContent value="marketplace" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-600" />
                      Top Performing Gigs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockAnalytics.marketplaceStats.topGigs.map((gig, index) => (
                        <div key={gig.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{gig.name}</div>
                              <div className="text-sm text-gray-600">{gig.orders} orders</div>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">${gig.revenue.toLocaleString()}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      Category Performance Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockAnalytics.marketplaceStats.categoryPerformance.map((item, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="font-medium text-sm mb-1">{item.category}</div>
                          <div className="text-xs text-gray-600 mb-2">
                            {item.subCategory} → {item.microCategory}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">{item.orders} orders</span>
                            <Badge variant="secondary">${item.revenue.toLocaleString()}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Referrals Tab */}
            <TabsContent value="referrals" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Total Referrals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-900">
                      {mockAnalytics.referralStats.totalReferrals.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Today Earnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900">
                      ${mockAnalytics.referralStats.todayEarnings}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      All Time Earnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900">
                      ${(mockAnalytics.referralStats.allTimeEarnings / 1000).toFixed(0)}K
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Referral Earnings Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="font-medium">Weekly Earnings</span>
                        <Badge className="bg-green-100 text-green-800">
                          ${mockAnalytics.referralStats.weeklyEarnings.toLocaleString()}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium">Monthly Earnings</span>
                        <Badge className="bg-blue-100 text-blue-800">
                          ${mockAnalytics.referralStats.monthlyEarnings.toLocaleString()}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span className="font-medium">Yearly Earnings</span>
                        <Badge className="bg-purple-100 text-purple-800">
                          ${mockAnalytics.referralStats.yearlyEarnings.toLocaleString()}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900 mb-2">
                          ${(mockAnalytics.referralStats.allTimeEarnings / 1000).toFixed(0)}K
                        </div>
                        <div className="text-gray-600">Total Referral Revenue</div>
                        <div className="text-sm text-gray-500 mt-1">
                          From {mockAnalytics.referralStats.totalReferrals.toLocaleString()} referrals
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Jobs Tab */}
            <TabsContent value="jobs" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                      Job Posting Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium">Today Posts</span>
                        <Badge className="bg-blue-100 text-blue-800">{mockAnalytics.jobStats.todayPosts}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="font-medium">Weekly Posts</span>
                        <Badge className="bg-green-100 text-green-800">{mockAnalytics.jobStats.weeklyPosts}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span className="font-medium">Monthly Posts</span>
                        <Badge className="bg-purple-100 text-purple-800">{mockAnalytics.jobStats.monthlyPosts}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span className="font-medium">Yearly Posts</span>
                        <Badge className="bg-orange-100 text-orange-800">
                          {mockAnalytics.jobStats.yearlyPosts.toLocaleString()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Money Spent on Jobs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="font-medium">Today Spent</span>
                        <Badge className="bg-green-100 text-green-800">
                          ${mockAnalytics.jobStats.todaySpent.toLocaleString()}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium">Weekly Spent</span>
                        <Badge className="bg-blue-100 text-blue-800">
                          ${mockAnalytics.jobStats.weeklySpent.toLocaleString()}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span className="font-medium">Monthly Spent</span>
                        <Badge className="bg-purple-100 text-purple-800">
                          ${mockAnalytics.jobStats.monthlySpent.toLocaleString()}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span className="font-medium">Yearly Spent</span>
                        <Badge className="bg-orange-100 text-orange-800">
                          ${(mockAnalytics.jobStats.yearlySpent / 1000).toFixed(0)}K
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Job Platform Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <div className="text-2xl font-bold text-blue-900">
                        {mockAnalytics.jobStats.yearlyPosts.toLocaleString()}
                      </div>
                      <div className="text-sm text-blue-700">Total Jobs This Year</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                      <div className="text-2xl font-bold text-green-900">
                        ${(mockAnalytics.jobStats.yearlySpent / 1000).toFixed(0)}K
                      </div>
                      <div className="text-sm text-green-700">Total Spent This Year</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                      <div className="text-2xl font-bold text-purple-900">
                        ${Math.round(mockAnalytics.jobStats.yearlySpent / mockAnalytics.jobStats.yearlyPosts)}
                      </div>
                      <div className="text-sm text-purple-700">Average Job Value</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
