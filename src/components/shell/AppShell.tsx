'use client'

import { Sidebar } from './Sidebar'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import Image from 'next/image'

export function AppShell({ children, profile }: { children: React.ReactNode, profile: any }) {
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
          
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 -mr-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
                <Menu size={24} strokeWidth={2.5} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r-0">
              <SheetTitle className="sr-only">Navigationsmenü</SheetTitle>
              <Sidebar profile={profile} className="flex h-full w-full" />
            </SheetContent>
          </Sheet>
        </header>

        {/* HIER WAR DER FEHLER: p-4 md:p-8 ist jetzt wieder da! */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-4 md:p-8 print:p-0 print:m-0 print:w-full print:max-w-none print:overflow-visible relative">
          {children}
        </main>
        
      </div>
    </div>
  )
}