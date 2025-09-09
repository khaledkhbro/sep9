"use client"

import { cn } from "@/lib/utils"
import { User, Bot, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { AnonymousMessage } from "@/lib/anonymous-chat-utils"

interface AnonymousMessageBubbleProps {
  message: AnonymousMessage
  isOwn: boolean
  showTime?: boolean
  className?: string
}

export function AnonymousMessageBubble({ message, isOwn, showTime = false, className }: AnonymousMessageBubbleProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getMessageIcon = () => {
    switch (message.senderType) {
      case "system":
        return <Bot className="h-3 w-3" />
      case "agent":
        return <User className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  const getMessageStyle = () => {
    if (isOwn) {
      return "bg-primary text-primary-foreground"
    }

    switch (message.messageType) {
      case "welcome":
        return "bg-card text-card-foreground border border-border"
      case "automated":
        return "bg-accent/10 text-accent-foreground border border-accent/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className={cn("flex gap-2 message-slide-in", className)}>
      {/* Avatar for non-user messages */}
      {!isOwn && (
        <div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
            message.senderType === "system" ? "bg-accent" : "bg-secondary",
          )}
        >
          <div className="text-white">{getMessageIcon()}</div>
        </div>
      )}

      <div className="flex flex-col gap-1 max-w-[80%]">
        {/* Message content */}
        <div className={cn("rounded-lg px-3 py-2 text-sm break-words", getMessageStyle(), isOwn && "ml-auto")}>
          {message.content}
        </div>

        {/* Message metadata */}
        {showTime && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs text-muted-foreground",
              isOwn ? "justify-end" : "justify-start",
            )}
          >
            <Clock className="h-3 w-3" />
            <span>{formatTime(message.timestamp)}</span>

            {message.messageType === "automated" && (
              <Badge variant="outline" className="text-xs h-4 px-1">
                Auto
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Avatar for user messages */}
      {isOwn && (
        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <User className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
    </div>
  )
}
