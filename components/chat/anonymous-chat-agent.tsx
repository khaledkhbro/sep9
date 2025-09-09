"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, Clock, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { AnonymousMessageBubble } from "./anonymous-message-bubble"
import type { AnonymousMessage, AnonymousSession } from "@/lib/anonymous-chat-utils"

interface SessionWithMessages extends AnonymousSession {
  messages: AnonymousMessage[]
  unreadCount: number
}

export function AnonymousChatAgent() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<SessionWithMessages[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchActiveSessions()
    const interval = setInterval(fetchActiveSessions, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchActiveSessions = async () => {
    try {
      const response = await fetch("/api/chat/anonymous/admin/sessions?status=active")
      const data = await response.json()

      if (data.success) {
        // Fetch messages for each session
        const sessionsWithMessages = await Promise.all(
          data.sessions.map(async (session: AnonymousSession) => {
            const messagesResponse = await fetch(`/api/chat/anonymous/messages?sessionId=${session.sessionId}`)
            const messagesData = await messagesResponse.json()

            return {
              ...session,
              messages: messagesData.messages || [],
              unreadCount:
                messagesData.messages?.filter(
                  (m: AnonymousMessage) => m.senderType === "user" && m.timestamp > (session.lastActivity || 0),
                ).length || 0,
            }
          }),
        )

        setSessions(sessionsWithMessages)
      }
    } catch (error) {
      console.error("[v0] Error fetching sessions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedSession) return

    try {
      const response = await fetch("/api/chat/anonymous/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSession,
          content: messageInput,
          senderType: "agent",
          agentId: user?.id,
        }),
      })

      if (response.ok) {
        setMessageInput("")
        fetchActiveSessions() // Refresh to get new message
      }
    } catch (error) {
      console.error("[v0] Error sending message:", error)
    }
  }

  const selectedSessionData = sessions.find((s) => s.sessionId === selectedSession)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Sessions List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Active Sessions ({sessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {sessions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No active sessions</div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedSession === session.sessionId ? "bg-emerald-50 border-emerald-200" : ""
                  }`}
                  onClick={() => setSelectedSession(session.sessionId)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium text-sm">{session.sessionId.substring(0, 12)}...</span>
                    </div>
                    {session.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {session.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(session.lastActivity).toLocaleTimeString()}
                  </div>
                  {session.messages.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {session.messages[session.messages.length - 1]?.content}
                    </p>
                  )}
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>
            {selectedSessionData ? (
              <div className="flex items-center justify-between">
                <span>Session: {selectedSessionData.sessionId.substring(0, 16)}...</span>
                <Badge variant="outline">{selectedSessionData.status}</Badge>
              </div>
            ) : (
              "Select a session to start chatting"
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-[500px]">
          {selectedSessionData ? (
            <>
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4 p-4">
                  {selectedSessionData.messages.map((message) => (
                    <AnonymousMessageBubble
                      key={message.id}
                      message={message}
                      isAgent={message.senderType === "agent"}
                    />
                  ))}
                </div>
              </ScrollArea>

              <div className="flex space-x-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!messageInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a session from the left to start responding to messages
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
