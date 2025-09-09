// WebSocket server for real-time anonymous chat
import { Server } from "socket.io"
import { sendAnonymousMessage, getSessionInfo, isValidSessionId } from "./anonymous-chat-utils"

export interface SocketData {
  sessionId?: string
  userType?: "user" | "agent"
  agentId?: string
}

export function initializeWebSocketServer(httpServer: any) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("[v0] Client connected:", socket.id)

    socket.on("join-anonymous-chat", async (data: { sessionId: string }) => {
      try {
        const { sessionId } = data

        if (!sessionId || !isValidSessionId(sessionId)) {
          socket.emit("error", { message: "Invalid session ID" })
          return
        }

        const session = await getSessionInfo(sessionId)
        if (!session || session.status !== "active") {
          socket.emit("error", { message: "Session not found or inactive" })
          return
        }

        socket.data.sessionId = sessionId
        socket.data.userType = "user"
        socket.join(`chat:${sessionId}`)

        socket.emit("joined-chat", { sessionId })
        console.log(`[v0] User joined anonymous chat: ${sessionId}`)
      } catch (error) {
        console.error("[v0] Error joining chat:", error)
        socket.emit("error", { message: "Failed to join chat" })
      }
    })

    socket.on("join-agent-room", async (data: { agentId: string }) => {
      try {
        socket.data.userType = "agent"
        socket.data.agentId = data.agentId
        socket.join("agents")

        socket.emit("joined-agent-room")
        console.log(`[v0] Agent joined: ${data.agentId}`)
      } catch (error) {
        console.error("[v0] Error joining agent room:", error)
        socket.emit("error", { message: "Failed to join agent room" })
      }
    })

    socket.on(
      "send-message",
      async (data: {
        sessionId: string
        content: string
        senderType?: "user" | "agent"
      }) => {
        try {
          const { sessionId, content, senderType = "user" } = data

          if (!sessionId || !content) {
            socket.emit("error", { message: "Missing required fields" })
            return
          }

          const session = await getSessionInfo(sessionId)
          if (!session || session.status !== "active") {
            socket.emit("error", { message: "Session not found or inactive" })
            return
          }

          const message = await sendAnonymousMessage(sessionId, content, senderType, "text", socket.data.agentId)

          // Broadcast to chat room
          io.to(`chat:${sessionId}`).emit("new-message", message)

          // Notify agents of new user message
          if (senderType === "user") {
            io.to("agents").emit("new-user-message", {
              sessionId,
              message,
              sessionInfo: {
                userIP: session.userIP?.substring(0, 8) + "...",
                createdAt: session.createdAt,
              },
            })
          }

          console.log(`[v0] Message sent in ${sessionId} by ${senderType}`)
        } catch (error) {
          console.error("[v0] Error sending message:", error)
          socket.emit("error", { message: "Failed to send message" })
        }
      },
    )

    socket.on("disconnect", () => {
      console.log("[v0] Client disconnected:", socket.id)
      if (socket.data.sessionId) {
        socket.leave(`chat:${socket.data.sessionId}`)
      }
      if (socket.data.userType === "agent") {
        socket.leave("agents")
      }
    })
  })

  return io
}
