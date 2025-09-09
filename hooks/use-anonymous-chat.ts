"use client"

import { useState, useEffect, useCallback } from "react"
import type { AnonymousMessage } from "@/lib/anonymous-chat-utils"

interface UseAnonymousChatOptions {
  autoConnect?: boolean
  enableNotifications?: boolean
}

export function useAnonymousChat(options: UseAnonymousChatOptions = {}) {
  const { autoConnect = false, enableNotifications = true } = options

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AnonymousMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(async () => {
    if (sessionId) return sessionId

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/chat/anonymous/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()
      if (data.success) {
        setSessionId(data.sessionId)
        setIsConnected(true)

        // Send welcome message
        setTimeout(async () => {
          await fetch("/api/chat/anonymous/automated", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: data.sessionId,
              messageType: "welcome",
            }),
          })
          loadMessages(data.sessionId)
        }, 500)

        return data.sessionId
      } else {
        throw new Error(data.error || "Failed to create session")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Connection failed"
      setError(errorMessage)
      console.error("[v0] Chat connection error:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  const loadMessages = useCallback(
    async (currentSessionId?: string) => {
      const targetSessionId = currentSessionId || sessionId
      if (!targetSessionId) return

      try {
        const response = await fetch(`/api/chat/anonymous/messages?sessionId=${targetSessionId}`)
        const data = await response.json()

        if (data.success) {
          setMessages(data.messages)
        }
      } catch (err) {
        console.error("[v0] Failed to load messages:", err)
      }
    },
    [sessionId],
  )

  const sendMessage = useCallback(
    async (content: string) => {
      if (!sessionId || !content.trim()) return false

      setIsLoading(true)
      try {
        const response = await fetch("/api/chat/anonymous/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            content: content.trim(),
            senderType: "user",
          }),
        })

        const data = await response.json()
        if (data.success) {
          await loadMessages()
          return true
        } else {
          throw new Error(data.error || "Failed to send message")
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Send failed"
        setError(errorMessage)
        console.error("[v0] Send message error:", err)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [sessionId, loadMessages],
  )

  const disconnect = useCallback(async () => {
    if (!sessionId) return

    try {
      await fetch("/api/chat/anonymous/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
    } catch (err) {
      console.error("[v0] Disconnect error:", err)
    } finally {
      setSessionId(null)
      setMessages([])
      setIsConnected(false)
      setError(null)
    }
  }, [sessionId])

  useEffect(() => {
    if (autoConnect && !sessionId && !isLoading) {
      connect()
    }
  }, [autoConnect, sessionId, isLoading, connect])

  useEffect(() => {
    if (!sessionId || !isConnected) return

    const interval = setInterval(() => {
      loadMessages()
    }, 3000) // Check for new messages every 3 seconds

    return () => clearInterval(interval)
  }, [sessionId, isConnected, loadMessages])

  return {
    sessionId,
    messages,
    isConnected,
    isLoading,
    error,
    connect,
    sendMessage,
    disconnect,
    loadMessages,
    clearError: () => setError(null),
  }
}
