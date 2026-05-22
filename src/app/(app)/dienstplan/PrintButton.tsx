'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PrintButton() {
  return (
    <Button
      variant="outline"
      onClick={() => window.print()}
      className="rounded-xl border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
      title="Dienstplan drucken"
    >
      <Printer size={16} className="sm:mr-2" />
      <span className="hidden sm:inline">Drucken</span>
    </Button>
  )
}