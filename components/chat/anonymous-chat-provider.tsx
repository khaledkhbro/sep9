"use client"

import type React from "react"

import { createContext, useContext, useState } from "react"
import { AnonymousChatWidget } from "./anonymous-chat-widget"

interface AnonymousChatContextType {
  isEnabled: boolean
  setEnabled: (enabled: boolean) => void
}

const AnonymousChatContext = createContext<AnonymousChatContextType>({
  isEnabled: true,
  setEnabled: () => {},
})

export function useAnonymousChat() {
  return useContext(AnonymousChatContext)
}

interface AnonymousChatProviderProps {
  children: React.ReactNode
  enabled?: boolean
}

export function AnonymousChatProvider({ children, enabled = true }: AnonymousChatProviderProps) {
  const [isEnabled, setEnabled] = useState(enabled)

  return (
    <AnonymousChatContext.Provider value={{ isEnabled, setEnabled }}>
      {children}
      {isEnabled && <AnonymousChatWidget />}
    </AnonymousChatContext.Provider>
  )
}
