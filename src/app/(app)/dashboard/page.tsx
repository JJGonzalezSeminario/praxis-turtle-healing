import { getSessionOrRedirect } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import {
  AlertCircle, Users, FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NewsBoardClient } from './NewsBoardClient'
import { AdminStats } from './AdminStats'

type Props = {
  searchParams: Promise<{ stat_month?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const profile = await getSessionOrRedirect()

  const supabase = await createClient()
  const todayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date())
  const startOfDay = `${todayStr}T00:00:00+02:00`
  const endOfDay = `${todayStr}T23:59:59+02:00`

  // ─── Monatsnavigation für Statistiken ───────────────────────────────────────
  const { stat_month } = await searchParams
  const now = new Date()
  const currentMonthStr = stat_month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [statYear, statMonthNum] = currentMonthStr.split('-').map(Number)
  const statMonthStart = `${currentMonthStr}-01`
  const statMonthLastDay = new Date(statYear, statMonthNum, 0).getDate()
  const statMonthEnd = `${currentMonthStr}-${String(statMonthLastDay).padStart(2, '0')}`

  // Werktage im Statistikmonat berechnen (Mo–Fr)
  let workingDays = 0
  for (let d = 1; d <= statMonthLastDay; d++) {
    const wd = new Date(statYear, statMonthNum - 1, d).getDay()
    if (wd !== 0 && wd !== 6) workingDays++
  }

  // Vor-/Nächster Monat für Navigation
  const prevDate = new Date(statYear, statMonthNum - 2, 1)
  const nextDate = new Date(statYear, statMonthNum, 1)
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
  const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`

  // Alle Daten PARALLEL laden
  const baseQueries = [
    supabase
      .from('inventory')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'offen'),
    supabase
      .from('shifts')
      .select('*, profiles!shifts_user_id_fkey(full_name)')
      .eq('date', todayStr)
      .eq('status', 'aktiv'),
    supabase
      .from('patient_intakes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay),
    supabase
      .from('news_board')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(20),
  ] as const

  // Admin-Statistiken nur für Super Admins laden
  const adminQueries = profile.is_super_admin
    ? [
        supabase
          .from('shifts')
          .select('user_id, date, start_time, end_time, status')
          .gte('date', statMonthStart)
          .lte('date', statMonthEnd),
        supabase
          .from('profiles')
          .select('id, full_name')
          .eq('is_active', true)
          .order('full_name'),
        supabase
          .from('requests')
          .select('id, user_id, type, status, start_date, end_date'),
        supabase
          .from('leave_balances')
          .select('user_id, total_days, used_days')
          .eq('year', statYear),
      ]
    : []

  const [ordersResult, shiftsResult, patientResult, newsResult, ...adminResults] =
    await Promise.all([...baseQueries, ...adminQueries])

  const orderCount = ordersResult.count ?? 0
  const workingToday = (shiftsResult.data ?? []) as any[]
  const patientCount = patientResult.count ?? 0
  const news = (newsResult.data ?? []) as any[]

  const isAdmin =
    profile.role?.slug === 'super_admin' || profile.role?.slug === 'it_admin'

  // Admin-Statistik-Daten auspacken
  const adminShifts = profile.is_super_admin ? ((adminResults[0] as any)?.data ?? []) : []
  const adminProfiles = profile.is_super_admin ? ((adminResults[1] as any)?.data ?? []) : []
  const adminRequests = profile.is_super_admin ? ((adminResults[2] as any)?.data ?? []) : []
  const adminLeaveBalances = profile.is_super_admin ? ((adminResults[3] as any)?.data ?? []) : []

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }
  const formattedDate = new Date().toLocaleDateString('de-DE', dateOptions)

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500 font-sans space-y-8">

      {/* 1. BEGRÜSSUNGS-BANNER */}
      <div className="bg-gradient-to-br from-teal-950 via-teal-900 to-emerald-900 rounded-[2rem] p-10 sm:p-14 text-white shadow-2xl shadow-teal-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <p className="text-teal-200/80 font-semibold uppercase tracking-widest text-xs mb-3">
            {formattedDate}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white">
            Guten Morgen, {profile.full_name?.split(' ')[0] || 'Team'}.
          </h1>
        </div>
      </div>

      {/* 2. WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Widget 1: Material */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-start mb-6">
            <div className={cn('p-4 rounded-2xl', orderCount > 0 ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-500' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400')}>
              <AlertCircle size={28} strokeWidth={2.5} />
            </div>
            <span className="text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">{orderCount}</span>
          </div>
          <div>
            <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 text-lg">Einkaufsliste</h3>
            <p className={cn('text-sm font-medium mt-1', orderCount > 0 ? 'text-rose-500' : 'text-zinc-400')}>
              {orderCount > 0 ? 'Artikel müssen bestellt werden' : 'Lagerbestände sind optimal'}
            </p>
          </div>
        </div>

        {/* Widget 2: Heute im Haus */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-2xl">
              <Users size={28} strokeWidth={2.5} />
            </div>
            <span className="text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">{workingToday.length}</span>
          </div>
          <div>
            <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 text-lg">Heute im Haus</h3>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1 truncate">
              {workingToday.length > 0
                ? workingToday.map((s: any) => s.profiles?.full_name?.split(' ')[0] || 'Teammitglied').join(', ')
                : 'Noch niemand eingeteilt'}
            </p>
          </div>
        </div>

        {/* Widget 3: Patienten */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 dark:text-indigo-400 rounded-2xl">
              <FileText size={28} strokeWidth={2.5} />
            </div>
            <span className="text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">{patientCount}</span>
          </div>
          <div>
            <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 text-lg">Neuaufnahmen</h3>
            <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500 mt-1">Erfasste Formulare (Heute)</p>
          </div>
        </div>
      </div>


      {/* 3. PINNWAND */}
      <NewsBoardClient
        initialNews={news}
        currentUserId={profile.id}
        isAdmin={isAdmin}
      />

      {/* 4. ADMIN-STATISTIKEN (nur Super Admin) */}
      {profile.is_super_admin && (
        <AdminStats
          profiles={adminProfiles}
          shifts={adminShifts}
          requests={adminRequests}
          leaveBalances={adminLeaveBalances}
          monthStr={currentMonthStr}
          prevMonthStr={prevMonthStr}
          nextMonthStr={nextMonthStr}
          workingDaysInMonth={workingDays}
        />
      )}

    </div>
  )
}