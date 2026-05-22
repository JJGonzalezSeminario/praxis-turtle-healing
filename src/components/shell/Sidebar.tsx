'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/lib/auth/permissions'
import type { UserProfile } from '@/types/permissions'
import {
  LayoutDashboard, Calendar, ClipboardList, BookOpen,
  ShoppingCart, UserCheck, FileText, Wrench, Building2,
  UserPlus, Settings, Shield
} from 'lucide-react'

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
      { href: '/onboarding',         label: 'Onboarding',         icon: UserCheck,       resource: 'onboarding'      as const },
      { href: '/dokumente',          label: 'Dokumentencenter',   icon: FileText,        resource: 'documents'       as const },
      { href: '/medizinprodukte',    label: 'Medizinprodukte',    icon: Wrench,          resource: 'medical_devices' as const },
      { href: '/lieferanten',        label: 'Lieferanten',        icon: Building2,       resource: 'suppliers'       as const },
    ]
  },
  {
    section: 'System',
    items: [
      { href: '/admin/nutzer', label: 'Nutzerverwaltung', icon: Settings, resource: 'user_management' as const },
      { href: '/admin/rollen', label: 'Rollen & Rechte',  icon: Shield,   resource: 'role_management' as const },
    ]
  }
]

export function Sidebar({ profile }: { profile: UserProfile }) {
  const pathname = usePathname()

  // Dynamische Daten aus dem Profil laden (mit Fallbacks zur Sicherheit)
  const fullName = profile?.full_name || 'Nutzer'
  const initials = (profile as any)?.initials || fullName.charAt(0).toUpperCase()
  const roleName = (profile as any)?.roles?.name || 'Mitarbeiter'

  return (
    <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col shrink-0 transition-all duration-300 print:hidden">
      <div className="px-5 py-6 border-b border-zinc-200/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-700 flex items-center justify-center text-white text-lg shadow-sm">
            🐢
          </div>
          <div>
            <p className="text-[14px] font-bold text-zinc-900 tracking-tight">Turtle-Healing</p>
            <p className="text-[11px] text-zinc-500 font-medium">Praxisverwaltung</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-6">
        {NAV_ITEMS.map(section => {
          const visibleItems = section.items.filter(item =>
            hasPermission(profile, item.resource, 'view')
          )
          if (visibleItems.length === 0) return null

          return (
            <div key={section.section}>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 mb-2">
                {section.section}
              </p>
              <div className="space-y-1">
                {visibleItems.map(item => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-200',
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 font-semibold'
                          : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 font-medium'
                      )}
                    >
                      <Icon size={16} className={cn("shrink-0", isActive ? "text-emerald-600" : "text-zinc-400")} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>
      
      {/* Profil & Logout am unteren Rand der Sidebar */}
      <div className="mt-auto border-t border-zinc-200 p-4 bg-zinc-50/50">
        <div className="flex items-center gap-3">
          {/* Dynamischer Avatar */}
          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0 uppercase">
            {initials}
          </div>
          {/* Dynamische Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900 truncate" title={fullName}>
              {fullName}
            </p>
            <p className="text-xs text-zinc-500 truncate" title={roleName}>
              {roleName}
            </p>
          </div>
          {/* Logout Button */}
          <button 
            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Abmelden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}