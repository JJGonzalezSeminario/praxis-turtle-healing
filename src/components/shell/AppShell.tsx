'use client'

import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import type { UserProfile } from '@/types/permissions'

interface AppShellProps {
  profile: UserProfile
  children: React.ReactNode
}

export function AppShell({ profile, children }: AppShellProps) {
  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}