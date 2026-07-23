'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Shield, Calendar } from 'lucide-react'

interface AuditLogFilterProps {
  initialQuery: string
  initialAction: string
  activeTab: 'security' | 'shifts'
}

/**
 * AuditLogFilter: Interaktive Filterleiste und Tabs für Audit Logs.
 * Läuft auf Client-Seite, um sofort auf Änderungen zu reagieren.
 */
export function AuditLogFilter({ initialQuery, initialAction, activeTab }: AuditLogFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleTabChange = (newTab: 'security' | 'shifts') => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', newTab)
    params.delete('action') // Aktions-Filter zurücksetzen beim Tab-Wechsel
    router.push(`/admin/audit-logs?${params.toString()}`)
  }

  const handleFilterChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(name, value)
    } else {
      params.delete(name)
    }
    router.push(`/admin/audit-logs?${params.toString()}`)
  }

  return (
    <div className="space-y-4 mb-6">
      {/* TABS */}
      <div className="flex border-b border-zinc-200 gap-2">
        <button
          type="button"
          onClick={() => handleTabChange('security')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'border-amber-500 text-amber-700 bg-amber-50/40 rounded-t-2xl'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-t-2xl'
          }`}
        >
          <Shield size={16} />
          <span>Nutzer & Sicherheit</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('shifts')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'shifts'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-2xl'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-t-2xl'
          }`}
        >
          <Calendar size={16} />
          <span>Dienstplan-Änderungen</span>
        </button>
      </div>

      {/* FILTERBAR */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-4">
        {/* Suche */}
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-400" />
          </div>
          <input
            type="text"
            placeholder="Nach ausführendem Nutzer oder betroffenem Mitarbeiter suchen..."
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
            {activeTab === 'security' ? (
              <>
                <option value="CREATE_USER">Nutzer erstellt</option>
                <option value="UPDATE_USER">Nutzer bearbeitet</option>
                <option value="RESET_PASSWORD">Passwort geändert</option>
              </>
            ) : (
              <>
                <option value="CREATE_SHIFT">Schicht erstellt</option>
                <option value="UPDATE_SHIFT">Schicht bearbeitet</option>
                <option value="DELETE_SHIFT">Schicht gelöscht</option>
              </>
            )}
          </select>
        </div>
      </div>
    </div>
  )
}

