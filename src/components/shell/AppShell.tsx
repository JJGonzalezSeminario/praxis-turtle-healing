'use client'

import { Sidebar } from './Sidebar'

import type { UserProfile } from '@/types/permissions'

interface AppShellProps {
  profile: UserProfile
  children: React.ReactNode
}

export function AppShell({ profile, children }: AppShellProps) {
  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden ">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        
        <main className="flex-1 overflow-y-auto p-6 print:p-0 print:m-0 print:w-full print:max-w-none print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  )
}