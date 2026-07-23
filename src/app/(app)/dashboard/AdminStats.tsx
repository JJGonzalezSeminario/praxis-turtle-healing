import {
  Clock,
  Users,
  CalendarCheck,
  CalendarX,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  User,
  CheckCircle2,
  XCircle,
  Hourglass,
  Palmtree,
  RefreshCcw,
  GraduationCap,
  Stethoscope,
  BarChart2,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Profile {
  id: string
  full_name: string
}

interface Shift {
  user_id: string
  date: string
  start_time: string
  end_time: string
  status: string
}

interface Request {
  id: string
  user_id: string
  type: string
  status: string
  start_date: string
  end_date: string
}

interface LeaveBalance {
  user_id: string
  total_days: number
  used_days: number
}

interface Props {
  profiles: Profile[]
  shifts: Shift[]
  requests: Request[]
  leaveBalances: LeaveBalance[]
  monthStr: string // e.g. "2026-07"
  prevMonthStr: string
  nextMonthStr: string
  workingDaysInMonth: number
}

// Berechnet Stunden aus start_time und end_time Strings (HH:MM)
function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const diff = (eh * 60 + em) - (sh * 60 + sm)
  return Math.max(0, diff / 60)
}

export function AdminStats({
  profiles,
  shifts,
  requests,
  leaveBalances,
  monthStr,
  prevMonthStr,
  nextMonthStr,
  workingDaysInMonth,
}: Props) {
  const monthDate = new Date(`${monthStr}-15T12:00:00`)
  const monthLabel = monthDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

  // ─── Arbeitsstunden ────────────────────────────────────────────────────────
  const activeShifts = shifts.filter(s => s.status === 'aktiv')
  const hoursPerEmployee = profiles.map(p => {
    const empShifts = activeShifts.filter(s => s.user_id === p.id)
    const ist = empShifts.reduce((sum, s) => sum + calcHours(s.start_time, s.end_time), 0)
    const soll = workingDaysInMonth * 8
    return { profile: p, ist: Math.round(ist * 10) / 10, soll }
  }).filter(e => e.ist > 0 || e.soll > 0)

  // ─── Urlaubsübersicht ────────────────────────────────────────────────────────
  const leaveMap = new Map(leaveBalances.map(lb => [lb.user_id, lb]))
  const pendingLeave = requests.filter(r => r.type === 'Urlaub' && r.status === 'ausstehend')
  const pendingDaysMap = new Map<string, number>()
  for (const req of pendingLeave) {
    const days = Math.ceil(
      (new Date(req.end_date).getTime() - new Date(req.start_date).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
    pendingDaysMap.set(req.user_id, (pendingDaysMap.get(req.user_id) || 0) + days)
  }

  // ─── Antragsübersicht ──────────────────────────────────────────────────────
  const requestTypes = [
    { type: 'Urlaub', icon: Palmtree, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { type: 'Schichtwechsel', icon: RefreshCcw, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { type: 'Fortbildung', icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { type: 'Krankmeldung', icon: Stethoscope, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  ]

  // ─── Anwesenheitsrate ──────────────────────────────────────────────────────
  const absenceShifts = shifts.filter(s => s.status !== 'aktiv')
  const absenceMap = new Map<string, number>()
  for (const s of absenceShifts) {
    absenceMap.set(s.user_id, (absenceMap.get(s.user_id) || 0) + 1)
  }
  const activeShiftCountMap = new Map<string, number>()
  for (const s of activeShifts) {
    activeShiftCountMap.set(s.user_id, (activeShiftCountMap.get(s.user_id) || 0) + 1)
  }

  // ─── Dienstplan-Abdeckung ──────────────────────────────────────────────────
  // Zähle aktive Mitarbeiter pro Wochentag (0=Mo,…,6=So)
  const coverageByWeekday = Array(7).fill(0)
  const countByWeekday = Array(7).fill(0)
  for (const s of activeShifts) {
    const d = new Date(`${s.date}T12:00:00`)
    const wd = (d.getDay() + 6) % 7 // Mo=0 … So=6
    coverageByWeekday[wd] += 1
    countByWeekday[wd] += 1
  }
  const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  const maxCoverage = Math.max(...coverageByWeekday, 1)

  return (
    <div className="space-y-6 mt-4">

      {/* ─── Sektion-Header + Monatsnavigation ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl border border-violet-100">
            <BarChart2 size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Team-Statistiken</h2>
            <p className="text-sm text-zinc-500 font-medium">Nur für Super Admins sichtbar</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`?stat_month=${prevMonthStr}`}
            className="p-2 bg-white border border-zinc-200 shadow-sm rounded-xl hover:bg-zinc-50 text-zinc-600 transition-colors"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </Link>
          <span className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-800 shadow-sm min-w-[140px] text-center">
            {monthLabel}
          </span>
          <Link
            href={`?stat_month=${nextMonthStr}`}
            className="p-2 bg-white border border-zinc-200 shadow-sm rounded-xl hover:bg-zinc-50 text-zinc-600 transition-colors"
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      {/* ─── Grid: Arbeitsstunden + Urlaubsübersicht ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Karte: Arbeitsstunden */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-zinc-900">Arbeitsstunden</h3>
              <p className="text-xs text-zinc-500 font-medium">Ist vs. Soll ({workingDaysInMonth} Werktage × 8h)</p>
            </div>
          </div>
          <div className="divide-y divide-zinc-100">
            {hoursPerEmployee.length === 0 ? (
              <div className="py-10 text-center text-zinc-400 text-sm font-medium">
                Keine Schichten in diesem Monat
              </div>
            ) : (
              hoursPerEmployee.map(({ profile, ist, soll }) => {
                const pct = Math.min(100, Math.round((ist / soll) * 100))
                const isOver = ist > soll
                const isUnder = ist < soll * 0.8
                return (
                  <div key={profile.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center">
                          <User size={14} className="text-zinc-500" />
                        </div>
                        <span className="text-sm font-bold text-zinc-800">{profile.full_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <span className={cn(
                          isOver ? 'text-emerald-600' : isUnder ? 'text-rose-500' : 'text-zinc-700'
                        )}>
                          {ist}h
                        </span>
                        <span className="text-zinc-300">/</span>
                        <span className="text-zinc-400 font-medium">{soll}h</span>
                      </div>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          isOver ? 'bg-emerald-500' : isUnder ? 'bg-rose-400' : 'bg-teal-500'
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Karte: Urlaubsübersicht */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CalendarCheck size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-zinc-900">Urlaubsübersicht {new Date(`${monthStr}-15`).getFullYear()}</h3>
              <p className="text-xs text-zinc-500 font-medium">Verfügbar / Verbraucht / Ausstehend</p>
            </div>
          </div>
          <div className="divide-y divide-zinc-100">
            {profiles.length === 0 ? (
              <div className="py-10 text-center text-zinc-400 text-sm font-medium">Keine Mitarbeiter</div>
            ) : (
              profiles.map(p => {
                const lb = leaveMap.get(p.id)
                const total = lb?.total_days ?? 30
                const used = lb?.used_days ?? 0
                const pending = pendingDaysMap.get(p.id) ?? 0
                const available = Math.max(0, total - used - pending)
                return (
                  <div key={p.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                      <User size={14} className="text-zinc-500" />
                    </div>
                    <span className="text-sm font-bold text-zinc-800 flex-1 truncate">{p.full_name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-lg font-bold">
                        {available}d frei
                      </span>
                      <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-lg font-bold">
                        {used}d genutzt
                      </span>
                      {pending > 0 && (
                        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-1 rounded-lg font-bold">
                          {pending}d ausstehend
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ─── Grid: Antragsübersicht + Anwesenheitsrate ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Karte: Antragsübersicht */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Hourglass size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-zinc-900">Antragsübersicht</h3>
              <p className="text-xs text-zinc-500 font-medium">Nach Typ und Status</p>
            </div>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            {requestTypes.map(({ type, icon: Icon, color, bg, border }) => {
              const ofType = requests.filter(r => r.type === type)
              const ausstehend = ofType.filter(r => r.status === 'ausstehend').length
              const genehmigt = ofType.filter(r => r.status === 'genehmigt').length
              const abgelehnt = ofType.filter(r => r.status === 'abgelehnt').length
              return (
                <div key={type} className={cn('rounded-2xl border p-4 space-y-3', bg, border)}>
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={color} />
                    <span className={cn('text-sm font-extrabold', color)}>{type}</span>
                  </div>
                  <div className="space-y-1.5 text-xs font-medium">
                    {ausstehend > 0 && (
                      <div className="flex items-center gap-1.5 text-amber-700">
                        <Hourglass size={12} />
                        <span>{ausstehend} ausstehend</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 size={12} />
                      <span>{genehmigt} genehmigt</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-rose-600">
                      <XCircle size={12} />
                      <span>{abgelehnt} abgelehnt</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Karte: Anwesenheitsrate */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-zinc-900">Anwesenheitsrate</h3>
              <p className="text-xs text-zinc-500 font-medium">Aktive Schichten vs. Fehlzeiten</p>
            </div>
          </div>
          <div className="p-6 grid grid-cols-2 gap-3">
            {profiles
              .filter(p => activeShiftCountMap.has(p.id) || absenceMap.has(p.id))
              .map(p => {
                const aktiv = activeShiftCountMap.get(p.id) ?? 0
                const abwesend = absenceMap.get(p.id) ?? 0
                const total = aktiv + abwesend
                const rate = total > 0 ? Math.round((aktiv / total) * 100) : 0
                const rateColor = rate >= 90 ? 'text-emerald-700' : rate >= 70 ? 'text-amber-700' : 'text-rose-600'
                const bgColor = rate >= 90 ? 'bg-emerald-50 border-emerald-100' : rate >= 70 ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100'
                return (
                  <div key={p.id} className={cn('rounded-2xl border p-4 flex flex-col gap-1', bgColor)}>
                    <div className="flex items-center gap-1.5 text-zinc-600 mb-1">
                      <User size={13} />
                      <span className="text-xs font-bold text-zinc-700 truncate">{p.full_name.split(' ')[0]}</span>
                    </div>
                    <span className={cn('text-2xl font-black tracking-tight', rateColor)}>{rate}%</span>
                    <span className="text-[10px] text-zinc-500 font-medium">{aktiv} Anwesend / {abwesend} Fehlzeit</span>
                  </div>
                )
              })}
            {profiles.filter(p => activeShiftCountMap.has(p.id) || absenceMap.has(p.id)).length === 0 && (
              <div className="col-span-2 py-8 text-center text-zinc-400 text-sm font-medium">
                Keine Schichtdaten in diesem Monat
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Dienstplan-Abdeckung ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-zinc-900">Dienstplan-Abdeckung</h3>
            <p className="text-xs text-zinc-500 font-medium">Aktive Mitarbeiter pro Wochentag (Summe im Monat)</p>
          </div>
        </div>
        <div className="px-8 py-6 flex items-end gap-4 h-44">
          {weekdays.map((day, idx) => {
            const count = coverageByWeekday[idx]
            const heightPct = maxCoverage > 0 ? Math.round((count / maxCoverage) * 100) : 0
            const isWeekend = idx >= 5
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-zinc-500">{count > 0 ? count : ''}</span>
                <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                  <div
                    className={cn(
                      'w-full rounded-t-xl transition-all',
                      isWeekend ? 'bg-zinc-100' : 'bg-sky-500'
                    )}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className={cn('text-xs font-bold', isWeekend ? 'text-zinc-300' : 'text-zinc-500')}>
                  {day}
                </span>
              </div>
            )
          })}
        </div>
        {activeShifts.length === 0 && (
          <div className="pb-6 text-center text-zinc-400 text-sm font-medium">
            Keine Schichtdaten in diesem Monat
          </div>
        )}
      </div>

    </div>
  )
}
