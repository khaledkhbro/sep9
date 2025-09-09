import { Card, CardContent } from "@/components/ui/card"
import { EarningsCard } from "./earnings-card"
import { TrendingUp, DollarSign, Calendar, Users, Clock } from "lucide-react"

interface EarningsSummaryData {
  totalEarnings: number
  yearlyEarnings: number
  monthlyEarnings: number
  lastMonthEarnings: number
  totalOrders: number
  averageOrderValue: number
  trends: {
    yearly: number
    monthly: number
    orders: number
  }
}

interface EarningsSummaryProps {
  data: EarningsSummaryData
  showAllCards?: boolean
  visibilitySettings?: {
    showTotalEarnings?: boolean
    showYearlyEarnings?: boolean
    showMonthlyEarnings?: boolean
    showLastMonthEarnings?: boolean
  }
}

export function EarningsSummary({
  data,
  showAllCards = true,
  visibilitySettings = {
    showTotalEarnings: true,
    showYearlyEarnings: true,
    showMonthlyEarnings: true,
    showLastMonthEarnings: true,
  },
}: EarningsSummaryProps) {
  const cards = [
    {
      key: "total",
      show: visibilitySettings.showTotalEarnings,
      title: "Total Earnings",
      amount: data.totalEarnings,
      icon: DollarSign,
    },
    {
      key: "yearly",
      show: visibilitySettings.showYearlyEarnings,
      title: "This Year",
      amount: data.yearlyEarnings,
      icon: TrendingUp,
      trend: {
        value: data.trends.yearly,
        isPositive: data.trends.yearly > 0,
      },
    },
    {
      key: "monthly",
      show: visibilitySettings.showMonthlyEarnings,
      title: "This Month",
      amount: data.monthlyEarnings,
      icon: Calendar,
      trend: {
        value: data.trends.monthly,
        isPositive: data.trends.monthly > 0,
      },
    },
    {
      key: "lastMonth",
      show: visibilitySettings.showLastMonthEarnings,
      title: "Last Month",
      amount: data.lastMonthEarnings,
      icon: Clock,
    },
  ]

  const visibleCards = cards.filter((card) => card.show)

  if (visibleCards.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Earnings information is not publicly visible</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleCards.map((card) => (
          <EarningsCard key={card.key} title={card.title} amount={card.amount} icon={card.icon} trend={card.trend} />
        ))}
      </div>

      {showAllCards && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EarningsCard
            title="Total Orders"
            amount={data.totalOrders}
            icon={Users}
            showCurrency={false}
            trend={{
              value: data.trends.orders,
              isPositive: data.trends.orders > 0,
            }}
          />
          <EarningsCard title="Average Order Value" amount={data.averageOrderValue} icon={TrendingUp} />
        </div>
      )}
    </div>
  )
}
