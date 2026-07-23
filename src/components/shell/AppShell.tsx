'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export function AppShell({ children, profile }: { children: React.ReactNode, profile: any }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const pathname = usePathname()

  // Schließe das Menü automatisch, wenn der Nutzer auf einen Link klickt (Seitenwechsel)
  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      
      {/* DESKTOP SIDEBAR */}
      <Sidebar profile={profile} className="hidden md:flex" />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        
        {/* MOBILE KOPFZEILE */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-zinc-200 print:hidden shadow-sm z-20 shrink-0">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={28} height={28} className="object-contain" priority />
            <span className="font-extrabold text-zinc-900 tracking-tight text-lg">Turtle-Healing</span>
          </div>
          
          <button
            onClick={() => setMobileNavOpen(true)}
            className="p-2 -mr-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
            aria-label="Navigationsmenü öffnen"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
        </header>

        {/* MOBILES NAVIGATION-DRAWER */}
        {mobileNavOpen && (
          <>
            {/* Hintergrund-Overlay zum Schließen */}
            <div
              className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
              onClick={() => setMobileNavOpen(false)}
              aria-hidden="true"
            />

            {/* Sidebar-Panel von links */}
            <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl md:hidden animate-in slide-in-from-left duration-200 flex flex-col">
              {/* Schließen-Button oben rechts */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <Image src="/logo.png" alt="Logo" width={28} height={28} className="object-contain" priority />
                  <span className="font-extrabold text-zinc-900 tracking-tight">Turtle-Healing</span>
                </div>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-lg transition-colors"
                  aria-label="Navigationsmenü schließen"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* Sidebar-Inhalt (ohne den eigenen Logo-Header, der ist schon oben) */}
              <div className="flex-1 overflow-y-auto">
                <Sidebar profile={profile} className="flex h-full w-full border-r-0" />
              </div>
            </div>
          </>
        )}

        {/* HAUPTINHALT */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-4 md:p-8 print:p-0 print:m-0 print:w-full print:max-w-none print:overflow-visible relative">
          {children}
        </main>
        
      </div>
    </div>
  )
}