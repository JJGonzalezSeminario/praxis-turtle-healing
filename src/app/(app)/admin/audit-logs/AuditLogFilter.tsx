'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

interface AuditLogFilterProps {
  initialQuery: string
  initialAction: string
}

/**
 * AuditLogFilter: Interaktive Filterleiste für Audit Logs.
 * Läuft auf Client-Seite, um sofort auf Änderungen des Select-Feldes zu reagieren.
 */
export function AuditLogFilter({ initialQuery, initialAction }: AuditLogFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilterChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(name, value)
    } else {
      params.delete(name)
    }
    // Aktualisiert die URL, Next.js Server Component lädt die Daten neu
    router.push(`/admin/audit-logs?${params.toString()}`)
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-6 mb-6 shadow-sm flex flex-col md:flex-row gap-4">
      {/* Suche */}
      <div className="flex-1 relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-zinc-400" />
        </div>
        <input
          type="text"
          placeholder="Nach Admin oder betroffenem Nutzer suchen..."
          defaultValue={initialQuery}
          onChange={e => handleFilterChange('query', e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-amber-500 focus:bg-white transition-all font-medium text-zinc-800"
        />
      </div>

      {/* Filter nach Aktion */}
      <div className="w-full md:w-64">
        <select
          value={initialAction}
          onChange={e => handleFilterChange('action', e.target.value)}
          className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-2xl outline-none focus:border-amber-500 font-bold text-zinc-700"
        >
          <option value="">Alle Aktionen</option>
          <option value="CREATE_USER">Nutzer erstellt</option>
          <option value="UPDATE_USER">Nutzer bearbeitet</option>
          <option value="RESET_PASSWORD">Passwort geändert</option>
        </select>
      </div>
    </div>
  )
}
