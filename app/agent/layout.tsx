"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated, isLoading, signOut } = useAuth()
  const router = useRouter()
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false)

  useEffect(() => {
    console.log("[v0] Agent layout auth state:", { user, isAuthenticated, isLoading, autoLoginAttempted })

    if (!isLoading && !autoLoginAttempted) {
      if (!isAuthenticated) {
        console.log("[v0] No user authenticated, redirecting to agent login")
        router.push("/agent/login")
      } else if (user?.userType !== "agent") {
        console.log("[v0] User is not agent, redirecting based on user type. User type:", user?.userType)
        if (user?.userType === "admin") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      } else {
        console.log("[v0] Agent user authenticated successfully")
      }
      setAutoLoginAttempted(true)
    }
  }, [isAuthenticated, isLoading, user, router, autoLoginAttempted])

  const handleSignOut = async () => {
    await signOut()
    router.push("/agent/login")
  }

  if (isLoading || (!isAuthenticated && !autoLoginAttempted)) {
    console.log("[v0] Agent layout showing loading state")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!isAuthenticated || user?.userType !== "agent") {
    console.log("[v0] Agent layout blocking access - not authenticated or not agent")
    return null
  }

  console.log("[v0] Agent layout rendering agent interface")
  return <div className="min-h-screen bg-gray-50">{children}</div>
}
