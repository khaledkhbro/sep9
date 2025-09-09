"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface ComparisonData {
  current: number
  previous: number
  label: string
  period: string
}

interface EarningsComparisonProps {
  comparisons: ComparisonData[]
  title?: string
}

export function EarningsComparison({ comparisons, title = "Performance Comparison" }: EarningsComparisonProps) {
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { percentage: 0, isPositive: true, isNeutral: true }

    const percentage = ((current - previous) / previous) * 100
    return {
      percentage: Math.abs(percentage),
      isPositive: percentage > 0,
      isNeutral: percentage === 0,
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {comparisons.map((comparison, index) => {
            const change = calculateChange(comparison.current, comparison.previous)

            return (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <div className="font-medium text-foreground">{comparison.label}</div>
                  <div className="text-sm text-muted-foreground">{comparison.period}</div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-lg">${comparison.current.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">vs ${comparison.previous.toLocaleString()}</div>
                  </div>

                  <Badge
                    variant={change.isNeutral ? "secondary" : change.isPositive ? "default" : "destructive"}
                    className={cn(
                      "flex items-center gap-1",
                      change.isPositive && !change.isNeutral && "bg-green-100 text-green-800 hover:bg-green-100",
                      change.isNeutral && "bg-gray-100 text-gray-800 hover:bg-gray-100",
                    )}
                  >
                    {change.isNeutral ? (
                      <Minus className="h-3 w-3" />
                    ) : change.isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {change.percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
