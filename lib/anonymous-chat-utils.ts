// Utility functions for anonymous chat system
import { v4 as uuidv4 } from "uuid"
import redisClient from "./redis-client"

export interface AnonymousMessage {
  id: string
  sessionId: string
  senderType: "user" | "agent" | "system"
  messageType: "text" | "automated" | "welcome"
  content: string
  timestamp: number
  agentId?: string
}

export interface AnonymousSession {
  sessionId: string
  userIP?: string
  userAgent?: string
  status: "active" | "closed" | "expired"
  agentId?: string
  createdAt: number
  lastActivity: number
}

export function generateSessionId(): string {
  return `anon_${Date.now()}_${uuidv4().substring(0, 8)}`
}

export async function createAnonymousSession(userIP?: string, userAgent?: string): Promise<string> {
  const sessionId = generateSessionId()

  const sessionData: AnonymousSession = {
    sessionId,
    userIP,
    userAgent,
    status: "active",
    createdAt: Date.now(),
    lastActivity: Date.now(),
  }

  // Store in Redis with 2-day TTL
  await redisClient.storeSession(sessionId, sessionData)

  return sessionId
}

export async function sendAnonymousMessage(
  sessionId: string,
  content: string,
  senderType: "user" | "agent" | "system" = "user",
  messageType: "text" | "automated" | "welcome" = "text",
  agentId?: string,
): Promise<AnonymousMessage> {
  const message: AnonymousMessage = {
    id: uuidv4(),
    sessionId,
    senderType,
    messageType,
    content,
    timestamp: Date.now(),
    agentId,
  }

  // Store in Redis
  await redisClient.storeMessage(sessionId, message)

  return message
}

export async function getSessionMessages(sessionId: string): Promise<AnonymousMessage[]> {
  return await redisClient.getMessages(sessionId)
}

export async function getSessionInfo(sessionId: string): Promise<AnonymousSession | null> {
  return await redisClient.getSession(sessionId)
}

export async function closeAnonymousSession(sessionId: string): Promise<void> {
  const session = await redisClient.getSession(sessionId)
  if (session) {
    session.status = "closed"
    await redisClient.storeSession(sessionId, session)
  }
}

export function getLocationFromIP(ip: string): { country?: string; city?: string } {
  // This is a placeholder - in production, use a service like MaxMind GeoIP
  // For privacy, only store general location, not exact coordinates
  return {
    country: "Unknown",
    city: "Unknown",
  }
}

export function isValidSessionId(sessionId: string): boolean {
  return /^anon_\d+_[a-f0-9]{8}$/.test(sessionId)
}
