// Authentication utilities and types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  username: string
  avatar?: string
  userType: "user" | "admin" | "suspended" | "agent" // Added agent user type
  isVerified: boolean
  deposit: number
  earning: number
  country: string
  createdAt: string
  isSuspended?: boolean
  suspensionReason?: string
  suspendedAt?: string
  suspendedBy?: string
  agentStatus?: "available" | "busy" | "offline"
  maxConcurrentChats?: number
  currentChatCount?: number
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function getAllUsers(): User[] {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem("users_database")
  return stored ? JSON.parse(stored) : []
}

export function saveUserToDatabase(user: User): void {
  if (typeof window === "undefined") return

  const users = getAllUsers()
  const existingIndex = users.findIndex((u) => u.email === user.email)

  if (existingIndex >= 0) {
    users[existingIndex] = user
  } else {
    users.push(user)
  }

  localStorage.setItem("users_database", JSON.stringify(users))
}

export function getNextUserId(): string {
  const users = getAllUsers()
  const maxId = users.reduce((max, user) => {
    const numId = Number.parseInt(user.id)
    return isNaN(numId) ? max : Math.max(max, numId)
  }, 0)

  return String(maxId + 1).padStart(2, "0")
}

export function initializeDefaultUsers(): void {
  const users = getAllUsers()

  if (users.length === 0) {
    const defaultUsers: User[] = [
      {
        id: "01",
        email: "admin@marketplace.com",
        firstName: "Admin",
        lastName: "User",
        username: "admin",
        userType: "admin",
        isVerified: true,
        deposit: 0,
        earning: 0,
        country: "United States",
        createdAt: new Date().toISOString(),
      },
      {
        id: "02",
        email: "agent1@marketplace.com",
        firstName: "Sarah",
        lastName: "Agent",
        username: "sarahagent",
        userType: "agent",
        isVerified: true,
        deposit: 0,
        earning: 0,
        country: "United States",
        createdAt: new Date().toISOString(),
        agentStatus: "available",
        maxConcurrentChats: 5,
        currentChatCount: 0,
      },
      {
        id: "03",
        email: "agent2@marketplace.com",
        firstName: "Mike",
        lastName: "Support",
        username: "mikesupport",
        userType: "agent",
        isVerified: true,
        deposit: 0,
        earning: 0,
        country: "United States",
        createdAt: new Date().toISOString(),
        agentStatus: "available",
        maxConcurrentChats: 3,
        currentChatCount: 0,
      },
      {
        id: "04",
        email: "worker1@marketplace.com",
        firstName: "John",
        lastName: "Worker",
        username: "johnworker",
        userType: "user",
        isVerified: true,
        deposit: 0,
        earning: 0,
        country: "United States",
        createdAt: new Date().toISOString(),
      },
      {
        id: "05",
        email: "employer1@marketplace.com",
        firstName: "Jane",
        lastName: "Employer",
        username: "janeemployer",
        userType: "user",
        isVerified: true,
        deposit: 100,
        earning: 0,
        country: "United States",
        createdAt: new Date().toISOString(),
      },
    ]

    defaultUsers.forEach((user) => saveUserToDatabase(user))
    console.log(
      "[v0] ✅ Initialized default users:",
      defaultUsers.map((u) => `${u.firstName} ${u.lastName} (ID: ${u.id})`),
    )
  }
}

// Mock authentication functions (replace with real API calls when database is connected)
export async function signIn(email: string, password: string): Promise<User> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const users = getAllUsers()
  const user = users.find((u) => u.email === email)

  if (!user) {
    throw new Error("Invalid email or password")
  }

  if (user.userType === "suspended") {
    const reason = user.suspensionReason || "No reason provided"
    throw new Error(`Your account has been suspended. Reason: ${reason}`)
  }

  if (email === "admin@marketplace.com" && password === "admin123") {
    console.log("[v0] Admin login successful for:", user.email)
    return user
  }

  if ((email === "agent1@marketplace.com" || email === "agent2@marketplace.com") && password === "agent123") {
    console.log("[v0] Agent login successful for:", user.email)
    return user
  }

  if (password === "password123" || password.length >= 8) {
    console.log("[v0] User login successful for:", user.email)
    return user
  }

  throw new Error("Invalid email or password")
}

export async function signUp(data: {
  email: string
  password: string
  firstName: string
  lastName: string
  username: string
}): Promise<User> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  if (!isValidEmail(data.email)) {
    throw new Error("Please enter a valid email address")
  }

  if (data.password.length < 8) {
    throw new Error("Password must be at least 8 characters long")
  }

  if (!isValidPassword(data.password)) {
    throw new Error("Password must contain at least one uppercase letter, one lowercase letter, and one number")
  }

  if (data.username.length < 3) {
    throw new Error("Username must be at least 3 characters long")
  }

  if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
    throw new Error("Username can only contain letters, numbers, and underscores")
  }

  const users = getAllUsers()
  const existingUser = users.find((u) => u.email === data.email || u.username === data.username)

  if (existingUser) {
    if (existingUser.email === data.email) {
      throw new Error("An account with this email already exists")
    } else {
      throw new Error("This username is already taken")
    }
  }

  const newUser: User = {
    id: getNextUserId(),
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    username: data.username,
    userType: "user",
    isVerified: false,
    deposit: 0,
    earning: 0,
    country: "United States", // Default to US instead of hardcoded Bangladesh
    createdAt: new Date().toISOString(),
  }

  saveUserToDatabase(newUser)

  return newUser
}

export async function signOut(): Promise<void> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500))
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null

  const stored = localStorage.getItem("user")
  return stored ? JSON.parse(stored) : null
}

export function storeUser(user: User): void {
  if (typeof window === "undefined") return
  localStorage.setItem("user", JSON.stringify(user))
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("user")
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidPassword(password: string): boolean {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  return passwordRegex.test(password)
}

export function updateUser(userId: string, updates: Partial<User>): User {
  const users = getAllUsers()
  const userIndex = users.findIndex((u) => u.id === userId)

  if (userIndex === -1) {
    throw new Error("User not found")
  }

  const updatedUser = { ...users[userIndex], ...updates }
  users[userIndex] = updatedUser

  localStorage.setItem("users_database", JSON.stringify(users))

  return updatedUser
}

export function toggleUserSuspension(userId: string): User {
  const users = getAllUsers()
  const userIndex = users.findIndex((u) => u.id === userId)

  if (userIndex === -1) {
    throw new Error("User not found")
  }

  const user = users[userIndex]
  // Toggle between user and suspended status (using a custom field)
  const updatedUser = {
    ...user,
    isSuspended: !user.isSuspended,
  }

  users[userIndex] = updatedUser
  localStorage.setItem("users_database", JSON.stringify(users))

  return updatedUser
}

export function suspendUserWithReason(userId: string, reason: string, suspendedBy: string): User {
  const users = getAllUsers()
  const userIndex = users.findIndex((u) => u.id === userId)

  if (userIndex === -1) {
    throw new Error("User not found")
  }

  const updatedUser = {
    ...users[userIndex],
    userType: "suspended" as const,
    suspensionReason: reason,
    suspendedAt: new Date().toISOString(),
    suspendedBy: suspendedBy,
  }

  users[userIndex] = updatedUser
  localStorage.setItem("users_database", JSON.stringify(users))

  return updatedUser
}

export function activateUser(userId: string): User {
  const users = getAllUsers()
  const userIndex = users.findIndex((u) => u.id === userId)

  if (userIndex === -1) {
    throw new Error("User not found")
  }

  const updatedUser = {
    ...users[userIndex],
    userType: "user" as const,
    suspensionReason: undefined,
    suspendedAt: undefined,
    suspendedBy: undefined,
  }

  users[userIndex] = updatedUser
  localStorage.setItem("users_database", JSON.stringify(users))

  return updatedUser
}

export async function getUser(): Promise<User | null> {
  // In a real implementation, this would validate JWT tokens or session cookies
  // For now, we'll simulate getting the current user from localStorage on the client
  // or return null on the server (since we don't have real session management)

  if (typeof window === "undefined") {
    // Server-side: In a real app, you'd validate session tokens here
    // For demo purposes, return a mock admin user for API calls
    return {
      id: "01",
      email: "admin@marketplace.com",
      firstName: "Admin",
      lastName: "User",
      username: "admin",
      userType: "admin",
      isVerified: true,
      deposit: 0,
      earning: 0,
      country: "United States",
      createdAt: new Date().toISOString(),
    }
  }

  // Client-side: Get user from localStorage
  return getStoredUser()
}

export function getAvailableAgents(): User[] {
  const users = getAllUsers()
  return users.filter(
    (user) =>
      user.userType === "agent" &&
      user.agentStatus === "available" &&
      (user.currentChatCount || 0) < (user.maxConcurrentChats || 5),
  )
}

export function updateAgentStatus(agentId: string, status: "available" | "busy" | "offline"): User {
  const users = getAllUsers()
  const agentIndex = users.findIndex((u) => u.id === agentId && u.userType === "agent")

  if (agentIndex === -1) {
    throw new Error("Agent not found")
  }

  const updatedAgent = { ...users[agentIndex], agentStatus: status }
  users[agentIndex] = updatedAgent

  localStorage.setItem("users_database", JSON.stringify(users))
  return updatedAgent
}

export function assignAgentToSession(sessionId: string): User | null {
  const availableAgents = getAvailableAgents()

  if (availableAgents.length === 0) {
    return null
  }

  // Simple round-robin assignment - pick agent with least current chats
  const agent = availableAgents.reduce((prev, current) =>
    (prev.currentChatCount || 0) < (current.currentChatCount || 0) ? prev : current,
  )

  // Update agent's current chat count
  const users = getAllUsers()
  const agentIndex = users.findIndex((u) => u.id === agent.id)
  if (agentIndex !== -1) {
    users[agentIndex].currentChatCount = (users[agentIndex].currentChatCount || 0) + 1
    localStorage.setItem("users_database", JSON.stringify(users))
  }

  return agent
}

export function releaseAgentFromSession(agentId: string): void {
  const users = getAllUsers()
  const agentIndex = users.findIndex((u) => u.id === agentId && u.userType === "agent")

  if (agentIndex !== -1) {
    users[agentIndex].currentChatCount = Math.max(0, (users[agentIndex].currentChatCount || 0) - 1)
    localStorage.setItem("users_database", JSON.stringify(users))
  }
}
