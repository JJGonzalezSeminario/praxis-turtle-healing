'use client'

import { createContext, useContext } from 'react'
import type { UserProfile } from '@/types/permissions'

const SessionContext = createContext<{ profile: UserProfile | null }>({ profile: null })

export function SessionProvider({
  profile,
  children
}: {
  profile: UserProfile
  children: React.ReactNode
}) {
  return (
    <SessionContext.Provider value={{ profile }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession muss innerhalb von SessionProvider verwendet werden')
  return ctx
}