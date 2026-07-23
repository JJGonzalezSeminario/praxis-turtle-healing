'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/lib/auth/permissions'
import type { UserProfile } from '@/types/permissions'
import {
  LayoutDashboard, Calendar, ClipboardList, BookOpen,
  ShoppingCart, FileText, NotebookTabs,
  UserPlus, Settings, Shield, FileSpreadsheet
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'


const NAV_ITEMS = [
  {
    section: 'Hauptmenü',
    items: [
      { href: '/dashboard',        label: 'Dashboard',         icon: LayoutDashboard,  resource: 'dashboard'       as const },
      { href: '/dienstplan',       label: 'Dienstplan',        icon: Calendar,         resource: 'shifts'          as const },
      { href: '/qm-checklisten',   label: 'QM-Checklisten',    icon: ClipboardList,    resource: 'qm_checklists'   as const },
      { href: '/wiki',             label: 'Praxis-Wiki',       icon: BookOpen,         resource: 'wiki'            as const },
      { href: '/patientenaufnahme', label: 'Patientenaufnahme', icon: UserPlus,         resource: 'patient_intake'  as const },
    ]
  },
  {
    section: 'Verwaltung',
    items: [
      { href: '/materialbestellung', label: 'Materialbestellung', icon: ShoppingCart,    resource: 'orders'          as const },
      { href: '/dokumente',          label: 'Dokumentencenter',   icon: FileText,        resource: 'documents'       as const },
      { href: '/kontaktbuch',        label: 'Kontaktbuch',        icon: NotebookTabs,    resource: 'contacts'        as const },
      { href: '/antraege',           label: 'Urlaub & Anträge',   icon: Calendar,        resource: 'requests'        as const },
    ]
  },
  {
    section: 'System',
    items: [
      { href: '/admin/nutzer', label: 'Nutzerverwaltung', icon: Settings, resource: 'user_management' as const },
      { href: '/admin/rollen', label: 'Rollen & Rechte',  icon: Shield,   resource: 'role_management' as const },
      { href: '/admin/audit-logs', label: 'Audit-Logs',    icon: FileSpreadsheet, resource: 'audit_logs' as const },
    ]
  }
]

export function Sidebar({ profile, className }: { profile: UserProfile, className?: string }) {
  const pathname = usePathname()

  const fullName = profile?.full_name || 'Nutzer'
  const initials = (profile as any)?.initials || fullName.charAt(0).toUpperCase()
  const roleName = (profile as any)?.roles?.name || 'Mitarbeiter'
  const router = useRouter()
  const supabase = createClient()
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)

  const isAdmin =
    profile.role?.slug === 'super_admin' ||
    profile.role?.slug === 'arzt' ||
    profile.role?.slug === 'it_admin'

  useEffect(() => {
    if (!isAdmin) return

    let isMounted = true

    // 1. Initial count abrufen
    const fetchPendingCount = async () => {
      try {
        const { count, error } = await supabase
          .from('requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ausstehend')
        if (!error && count !== null && isMounted) {
          setPendingRequestsCount(count)
        }
      } catch (err) {
        console.error('Fehler beim Abrufen ausstehender Anträge:', err)
      }
    }
    fetchPendingCount()

    // 2. Eindeutigen Channel-Namen pro Instanz erzeugen
    const channelName = `sidebar-requests-${Math.random().toString(36).slice(2, 9)}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
        },
        () => {
          fetchPendingCount()
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [isAdmin, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  // SPERRE: Wenn der Nutzer die Rolle "Patient" hat, wird die Sidebar komplett ausgeblendet
  if (roleName === 'Patient') {
    return null
  }

  return (
    <aside className={cn("w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0 transition-all duration-300 print:hidden", className)}>
      
      <div className="px-6 py-8 border-b border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 flex items-center justify-center p-0.5">
            <Image 
              src="/logo.png" 
              alt="Turtle-Healing Logo" 
              width={48} 
              height={48} 
              className="object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="text-[17px] font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">Turtle-Healing</p>
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400 font-medium -mt-0.5">Praxisverwaltung</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 overflow-y-auto space-y-7">
        {NAV_ITEMS.map(section => {
          const visibleItems = section.items.filter(item =>
            hasPermission(profile, item.resource, 'view')
          )
          if (visibleItems.length === 0) return null

          return (
            <div key={section.section}>
              <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-3 mb-2">
                {section.section}
              </p>
              <div className="space-y-1">
                {visibleItems.map(item => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  const isRequestsItem = item.href === '/antraege'
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-all duration-200',
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold shadow-sm'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon size={16} className={cn("shrink-0", isActive ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500")} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isRequestsItem && pendingRequestsCount > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 min-w-[18px] text-center animate-pulse">
                          {pendingRequestsCount}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>
      
      <div className="mt-auto border-t border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Design</span>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0 uppercase shadow-inner">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={fullName}>
              {fullName}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate" title={roleName}>
              {roleName}
            </p>
          </div>
          <button onClick={handleLogout} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors" title="Abmelden">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </div>
    </aside>
  )
}