'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import type { UserProfile } from '@/types/permissions'

export function Topbar({ profile }: { profile: UserProfile }) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-16 bg-white border-b border-zinc-200 px-6 flex items-center justify-between shrink-0 print:hidden">
      <div className="flex-1" /> {/* Platzhalter für zukünftige Breadcrumbs oder Suche */}
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pr-4 border-r border-zinc-200">
          <div className="flex flex-col items-end">
            <span className="text-[13px] font-semibold text-zinc-900">{profile.full_name}</span>
            <span className="text-[11px] text-zinc-500 font-medium">
              {profile.role?.name ?? 'Keine Rolle'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-[13px] font-bold text-emerald-800 shrink-0">
            {profile.initials}
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Abmelden"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}