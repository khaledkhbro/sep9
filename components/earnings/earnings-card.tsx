import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EarningsCardProps {
  title: string
  amount: number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  showCurrency?: boolean
}

export function EarningsCard({ title, amount, icon: Icon, trend, className, showCurrency = true }: EarningsCardProps) {
  return (
    <Card className={cn("earnings-card", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Icon className="h-8 w-8 text-primary" />
          {trend && (
            <div className={cn("text-sm font-medium", trend.isPositive ? "text-green-600" : "text-red-600")}>
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-2xl font-bold text-primary">
            {showCurrency ? `$${amount.toLocaleString()}` : amount.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">{title}</div>
        </div>
      </CardContent>
    </Card>
  )
}
