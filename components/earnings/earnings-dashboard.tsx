"use client"

import { useState } from "react"
import { EarningsSummary } from "./earnings-summary"
import { EarningsChart } from "./earnings-chart"
import { EarningsComparison } from "./earnings-comparison"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp } from "lucide-react"

interface EarningsDashboardProps {
  userId: string
  isPublicView?: boolean
  visibilitySettings?: {
    showTotalEarnings?: boolean
    showYearlyEarnings?: boolean
    showMonthlyEarnings?: boolean
    showLastMonthEarnings?: boolean
  }
}

// Mock data - in real app this would come from API
const mockEarningsData = {
  totalEarnings: 125000,
  yearlyEarnings: 85000,
  monthlyEarnings: 12500,
  lastMonthEarnings: 11200,
  totalOrders: 189,
  averageOrderValue: 661,
  trends: {
    yearly: 15.2,
    monthly: 11.6,
    orders: 8.3,
  },
}

const mockChartData = [
  { period: "Jan", earnings: 8500, orders: 12 },
  { period: "Feb", earnings: 9200, orders: 14 },
  { period: "Mar", earnings: 10800, orders: 16 },
  { period: "Apr", earnings: 11200, orders: 15 },
  { period: "May", earnings: 12500, orders: 18 },
  { period: "Jun", earnings: 13800, orders: 20 },
]

const mockComparisonData = [
  {
    current: 12500,
    previous: 11200,
    label: "Monthly Earnings",
    period: "This month vs last month",
  },
  {
    current: 85000,
    previous: 73500,
    label: "Yearly Earnings",
    period: "This year vs last year",
  },
  {
    current: 18,
    previous: 16,
    label: "Monthly Orders",
    period: "This month vs last month",
  },
]

export function EarningsDashboard({
  userId,
  isPublicView = false,
  visibilitySettings = {
    showTotalEarnings: true,
    showYearlyEarnings: true,
    showMonthlyEarnings: true,
    showLastMonthEarnings: true,
  },
}: EarningsDashboardProps) {
  const [chartType, setChartType] = useState<"line" | "bar">("line")
  const [timeRange, setTimeRange] = useState("6months")

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">{isPublicView ? "Public Earnings" : "Earnings Overview"}</h2>
        </div>

        <EarningsSummary data={mockEarningsData} showAllCards={!isPublicView} visibilitySettings={visibilitySettings} />
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Earnings Trend</h3>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">3 Months</SelectItem>
                  <SelectItem value="6months">6 Months</SelectItem>
                  <SelectItem value="1year">1 Year</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={() => setChartType(chartType === "line" ? "bar" : "line")}>
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <EarningsChart data={mockChartData} type={chartType} height={300} showOrders={!isPublicView} />
        </div>

        {!isPublicView && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Performance Comparison</h3>
            <EarningsComparison comparisons={mockComparisonData} />
          </div>
        )}
      </div>

      {/* Additional Stats for Private View */}
      {!isPublicView && (
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Best Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">$13,800</div>
              <div className="text-sm text-muted-foreground">June 2024</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Growth Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+15.2%</div>
              <div className="text-sm text-muted-foreground">Year over year</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Next Milestone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">$150K</div>
              <div className="text-sm text-muted-foreground">$25K remaining</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
