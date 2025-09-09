"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

interface EarningsData {
  period: string
  earnings: number
  orders?: number
}

interface EarningsChartProps {
  data: EarningsData[]
  title?: string
  type?: "line" | "bar"
  height?: number
  showOrders?: boolean
}

export function EarningsChart({
  data,
  title = "Earnings Overview",
  type = "line",
  height = 300,
  showOrders = false,
}: EarningsChartProps) {
  const formatTooltip = (value: number, name: string) => {
    if (name === "earnings") {
      return [`$${value.toLocaleString()}`, "Earnings"]
    }
    if (name === "orders") {
      return [value.toString(), "Orders"]
    }
    return [value.toString(), name]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {type === "line" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  formatter={formatTooltip}
                  labelFormatter={(label) => `Period: ${label}`}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                />
                {showOrders && (
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2, r: 4 }}
                  />
                )}
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  formatter={formatTooltip}
                  labelFormatter={(label) => `Period: ${label}`}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                {showOrders && <Bar dataKey="orders" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
