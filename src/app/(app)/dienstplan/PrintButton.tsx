'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PrintButton() {
  return (
    <Button
      variant="outline"
      onClick={() => window.print()}
      className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      title="Dienstplan drucken"
    >
      <Printer size={16} className="sm:mr-2" />
      <span className="hidden sm:inline">Drucken</span>
    </Button>
  )
}