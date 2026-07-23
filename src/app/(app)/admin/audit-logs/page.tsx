import { getSessionOrRedirect } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { Shield, Clock, FileSpreadsheet, Calendar } from 'lucide-react'
import { redirect } from 'next/navigation'
import { AuditLogFilter } from './AuditLogFilter'

interface AuditLog {
  id: string
  created_at: string
  action: string
  details: Record<string, any>
  actor: { full_name: string; email: string } | null
  target: { full_name: string; email: string } | null
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; action?: string; tab?: string }>
}) {
  const profile = await getSessionOrRedirect()
  if (!profile.is_super_admin) {
    redirect('/dashboard')
  }

  const { query = '', action = '', tab = 'security' } = await searchParams
  const activeTab = tab === 'shifts' ? 'shifts' : 'security'

  const supabase = await createClient()

  let dbQuery = supabase
    .from('audit_logs')
    .select(`
      id,
      created_at,
      action,
      details,
      actor:profiles!audit_logs_actor_id_fkey(full_name, email),
      target:profiles!audit_logs_target_user_id_fkey(full_name, email)
    `)
    .order('created_at', { ascending: false })

  if (action) {
    dbQuery = dbQuery.eq('action', action)
  } else {
    if (activeTab === 'shifts') {
      dbQuery = dbQuery.in('action', ['CREATE_SHIFT', 'UPDATE_SHIFT', 'DELETE_SHIFT'])
    } else {
      dbQuery = dbQuery.in('action', ['CREATE_USER', 'UPDATE_USER', 'RESET_PASSWORD'])
    }
  }

  const { data: logsData, error } = await dbQuery

  if (error) {
    console.error('Fehler beim Laden der Audit-Logs:', error)
  }

  const rawLogs = (logsData ?? []) as any[]

  const filteredLogs: AuditLog[] = rawLogs
    .map(log => ({
      id: log.id,
      created_at: log.created_at,
      action: log.action,
      details: log.details || {},
      actor: log.actor ? { full_name: log.actor.full_name, email: log.actor.email } : null,
      target: log.target ? { full_name: log.target.full_name, email: log.target.email } : null,
    }))
    .filter(log => {
      if (!query) return true
      const search = query.toLowerCase()
      return (
        log.actor?.full_name?.toLowerCase().includes(search) ||
        log.actor?.email?.toLowerCase().includes(search) ||
        log.target?.full_name?.toLowerCase().includes(search) ||
        log.target?.email?.toLowerCase().includes(search)
      )
    })

  const actionLabels: Record<string, string> = {
    CREATE_USER: 'Nutzer erstellt',
    UPDATE_USER: 'Nutzer bearbeitet',
    RESET_PASSWORD: 'Passwort geändert',
    CREATE_SHIFT: 'Schicht erstellt',
    UPDATE_SHIFT: 'Schicht bearbeitet',
    DELETE_SHIFT: 'Schicht gelöscht',
  }

  const fieldLabels: Record<string, string> = {
    profile_id: 'Mitarbeiter ID',
    date: 'Datum',
    start_time: 'Beginn',
    end_time: 'Ende',
    status: 'Status',
    shift_type: 'Schicht-Typ',
    full_name: 'Name',
    email: 'E-Mail',
    role_id: 'Rollen ID',
    is_active: 'Aktiv Status',
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
              <FileSpreadsheet size={28} />
            </div>
            Sicherheits- & Audit-Logs
          </h1>
          <p className="text-zinc-500 font-medium mt-2">
            Aktivitäten der Nutzer, Sicherheitsereignisse und Dienstplan-Änderungen einsehen.
          </p>
        </div>
      </div>

      {/* FILTERBAR & TABS */}
      <AuditLogFilter initialQuery={query} initialAction={action} activeTab={activeTab} />

      {/* TABELLE */}
      <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-100 text-xs uppercase tracking-wider text-zinc-500 font-bold">
              <th className="p-4 pl-6">Zeitstempel</th>
              <th className="p-4">Ausführender Nutzer</th>
              <th className="p-4">Ereignis</th>
              <th className="p-4">Betroffener Mitarbeiter</th>
              <th className="p-4 pr-6">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-sm font-medium text-zinc-700">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-zinc-400 font-semibold text-sm">
                  Keine Audit-Einträge für diese Auswahl gefunden.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => {
                const actionLabel = actionLabels[log.action] || log.action
                const isShiftAction = log.action.endsWith('_SHIFT')
                
                return (
                  <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                    
                    {/* Zeitstempel */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Clock size={14} />
                        <span>
                          {new Date(log.created_at).toLocaleString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Ausführender Nutzer */}
                    <td className="p-4">
                      {log.actor ? (
                        <div>
                          <div className="font-bold text-zinc-900">{log.actor.full_name}</div>
                          <div className="text-xs text-zinc-400">{log.actor.email}</div>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic">System / Gelöscht</span>
                      )}
                    </td>

                    {/* Ereignis */}
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 ${
                        isShiftAction 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {isShiftAction ? <Calendar size={12} /> : <Shield size={12} />}
                        {actionLabel}
                      </span>
                    </td>

                    {/* Betroffener Mitarbeiter */}
                    <td className="p-4">
                      {log.target ? (
                        <div>
                          <div className="font-bold text-zinc-900">{log.target.full_name}</div>
                          <div className="text-xs text-zinc-400">{log.target.email}</div>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic">Keiner / Gelöscht</span>
                      )}
                    </td>

                    {/* Details */}
                    <td className="p-4 pr-6 text-xs text-zinc-600 max-w-xs">
                      {log.action === 'CREATE_SHIFT' ? (
                        <div>
                          <span className="font-bold text-zinc-800">
                            {log.details.start_date === log.details.end_date
                              ? log.details.start_date
                              : `${log.details.start_date} bis ${log.details.end_date}`}
                          </span>
                          <div className="text-zinc-500 mt-0.5">
                            {log.details.start_time} - {log.details.end_time} ({log.details.shift_type}, {log.details.status})
                          </div>
                        </div>
                      ) : log.action === 'UPDATE_SHIFT' && log.details.changes ? (
                        <div className="space-y-1">
                          {Object.keys(log.details.changes).length === 0 ? (
                            <span className="text-zinc-400">Keine Änderungen</span>
                          ) : (
                            Object.keys(log.details.changes).map(field => {
                              const change = log.details.changes[field]
                              const label = fieldLabels[field] || field
                              return (
                                <div key={field} className="truncate">
                                  <span className="font-bold">{label}</span>:{' '}
                                  <span className="text-rose-500">{String(change.old)}</span> →{' '}
                                  <span className="text-emerald-600">{String(change.new)}</span>
                                </div>
                              )
                            })
                          )}
                        </div>
                      ) : log.action === 'DELETE_SHIFT' ? (
                        <div>
                          <span className="font-bold text-zinc-800">{log.details.date || 'Schicht'}</span>
                          <div className="text-zinc-500 mt-0.5">
                            {log.details.start_time} - {log.details.end_time} ({log.details.shift_type})
                            {log.details.delete_group && <span className="ml-1 text-rose-600 font-bold">[Gruppe]</span>}
                          </div>
                        </div>
                      ) : log.action === 'UPDATE_USER' && log.details.changes ? (
                        <div className="space-y-1">
                          {Object.keys(log.details.changes).map(field => {
                            const change = log.details.changes[field]
                            const label = fieldLabels[field] || field
                            return (
                              <div key={field} className="truncate">
                                <span className="font-bold">{label}</span>:{' '}
                                <span className="text-rose-500">{String(change.old)}</span> →{' '}
                                <span className="text-emerald-600">{String(change.new)}</span>
                              </div>
                            )
                          })}
                        </div>
                      ) : log.action === 'CREATE_USER' ? (
                        <div>Neuer Account erstellt</div>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>

                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

