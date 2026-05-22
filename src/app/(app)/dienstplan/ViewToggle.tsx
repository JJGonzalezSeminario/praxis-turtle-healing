'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CalendarDays, Clock, CalendarRange } from 'lucide-react'

export function ViewToggle() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentView = searchParams.get('view') || 'monat'

  const toggleView = (view: 'monat' | 'woche' | 'tag') => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', view)
    
    // Wenn wir von Monat auf Woche/Tag wechseln und kein Datum haben, nimm heute
    if (view !== 'monat' && !params.get('date')) {
      const today = new Date().toISOString().split('T')[0]
      params.set('date', today)
    }
    
    router.push(`/dienstplan?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200/50 print:hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleView('monat')}
        className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
          currentView === 'monat' ? 'bg-white text-zinc-900 shadow-sm font-semibold' : 'text-zinc-500 hover:text-zinc-900'
        }`}
      >
        <CalendarDays size={14} className="mr-1.5" /> Monat
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleView('woche')}
        className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
          currentView === 'woche' ? 'bg-white text-zinc-900 shadow-sm font-semibold' : 'text-zinc-500 hover:text-zinc-900'
        }`}
      >
        <CalendarRange size={14} className="mr-1.5" /> Woche
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleView('tag')}
        className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
          currentView === 'tag' ? 'bg-white text-zinc-900 shadow-sm font-semibold' : 'text-zinc-500 hover:text-zinc-900'
        }`}
      >
        <Clock size={14} className="mr-1.5" /> Tag
      </Button>
    </div>
  )
}