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
    
    if (view !== 'monat' && !params.get('date')) {
      const today = new Date().toISOString().split('T')[0]
      params.set('date', today)
    }
    
    router.push(`/dienstplan?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-800 print:hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleView('monat')}
        className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
          currentView === 'monat' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-semibold' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
      >
        <CalendarDays size={14} className="mr-1.5" /> Monat
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleView('woche')}
        className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
          currentView === 'woche' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-semibold' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
      >
        <CalendarRange size={14} className="mr-1.5" /> Woche
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleView('tag')}
        className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
          currentView === 'tag' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-semibold' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
      >
        <Clock size={14} className="mr-1.5" /> Tag
      </Button>
    </div>
  )
}