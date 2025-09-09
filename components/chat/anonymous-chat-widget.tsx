"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, X, Minimize2, Send, User, Bot, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnonymousMessage } from "@/lib/anonymous-chat-utils"

interface AnonymousChatWidgetProps {
  className?: string
}

export function AnonymousChatWidget({ className }: AnonymousChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AnonymousMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const initializeChat = async () => {
    if (sessionId) return

    setIsConnecting(true)
    try {
      const response = await fetch("/api/chat/anonymous/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()
      if (data.success) {
        setSessionId(data.sessionId)

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
      }
    } catch (error) {
      console.error("[v0] Failed to initialize chat:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const loadMessages = async (currentSessionId: string) => {
    try {
      const response = await fetch(`/api/chat/anonymous/messages?sessionId=${currentSessionId}`)
      const data = await response.json()

      if (data.success) {
        setMessages(data.messages)
        scrollToBottom()
      }
    } catch (error) {
      console.error("[v0] Failed to load messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || !sessionId || isLoading) return

    const messageContent = inputValue.trim()
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat/anonymous/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          content: messageContent,
          senderType: "user",
        }),
      })

      const data = await response.json()
      if (data.success) {
        await loadMessages(sessionId)
      }
    } catch (error) {
      console.error("[v0] Failed to send message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleOpen = () => {
    setIsOpen(true)
    setHasNewMessage(false)
    if (!sessionId) {
      initializeChat()
    }
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleClose = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  const handleMinimize = () => {
    setIsMinimized(true)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!sessionId || messages.length === 0) return

    const interval = setInterval(async () => {
      if (Math.random() > 0.95) {
        // 5% chance every 3 seconds
        await loadMessages(sessionId)
        if (!isOpen) {
          setHasNewMessage(true)
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [sessionId, messages.length, isOpen])

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      {/* Chat Widget */}
      {isOpen && (
        <Card
          className={cn(
            "w-80 h-96 mb-4 shadow-2xl border-0 overflow-hidden",
            "chat-widget-enter",
            isMinimized && "h-12",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="font-medium text-sm">{isConnecting ? "Connecting..." : "Customer Support"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={handleMinimize}
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={handleClose}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <ScrollArea className="flex-1 h-64 p-3">
                <div className="space-y-3">
                  {isConnecting ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Connecting to support...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                        <MessageCircle className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">Start a conversation with our support team</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-2 message-slide-in",
                          message.senderType === "user" ? "justify-end" : "justify-start",
                        )}
                      >
                        {message.senderType !== "user" && (
                          <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            {message.senderType === "system" ? (
                              <Bot className="h-3 w-3 text-accent-foreground" />
                            ) : (
                              <User className="h-3 w-3 text-accent-foreground" />
                            )}
                          </div>
                        )}

                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                            message.senderType === "user"
                              ? "bg-primary text-primary-foreground"
                              : message.messageType === "welcome"
                                ? "bg-card text-card-foreground border border-border"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {message.content}
                        </div>

                        {message.senderType === "user" && (
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <User className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-3 border-t bg-card/50">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading || isConnecting}
                    className="flex-1 text-sm"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || isLoading || isConnecting}
                    size="icon"
                    className="h-9 w-9"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Chat Button */}
      <Button
        onClick={handleOpen}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg relative",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "transition-all duration-300 hover:scale-110",
          hasNewMessage && "chat-bubble-pulse",
        )}
      >
        <MessageCircle className="h-6 w-6" />
        {hasNewMessage && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-destructive text-destructive-foreground text-xs">
            !
          </Badge>
        )}
      </Button>
    </div>
  )
}
