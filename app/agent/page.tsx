"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Users, Clock, Settings } from "lucide-react"
import { AnonymousChatAgent } from "@/components/chat/anonymous-chat-agent"

export default function AgentDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [agentStats, setAgentStats] = useState({
    activeSessions: 0,
    totalMessages: 0,
    avgResponseTime: "2.3 min",
    status: "available" as "available" | "busy" | "offline",
  })

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.userType !== "agent")) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!isAuthenticated || user?.userType !== "agent") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.firstName}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge
                variant={agentStats.status === "available" ? "default" : "secondary"}
                className={agentStats.status === "available" ? "bg-green-100 text-green-800" : ""}
              >
                {agentStats.status}
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agentStats.activeSessions}</div>
              <p className="text-xs text-muted-foreground">
                {user.currentChatCount || 0} / {user.maxConcurrentChats || 5} max
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages Today</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agentStats.totalMessages}</div>
              <p className="text-xs text-muted-foreground">+12% from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agentStats.avgResponseTime}</div>
              <p className="text-xs text-muted-foreground">-0.5 min from last week</p>
            </CardContent>
          </Card>
        </div>

        <AnonymousChatAgent />
      </div>
    </div>
  )
}
