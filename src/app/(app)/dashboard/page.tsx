import { getSessionOrRedirect } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import {
  AlertCircle, Users, FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NewsBoardClient } from './NewsBoardClient'

export default async function DashboardPage() {
  // Der Patienten-Redirect wird jetzt zentral in (app)/layout.tsx gehandhabt.
  // Dieser Guard hier ist daher nicht mehr nötig.
  const profile = await getSessionOrRedirect()

  const supabase = await createClient()
  // Fix: Berliner Zeitzone verwenden (nicht UTC), da toISOString() UTC zurückgibt
  // und um 23:00-23:59 Berliner Zeit bereits der nächste UTC-Tag beginnt.
  const todayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date())
  const startOfDay = `${todayStr}T00:00:00+02:00`
  const endOfDay = `${todayStr}T23:59:59+02:00`

  // Fix #7: Alle Daten PARALLEL laden statt sequenziell
  const [ordersResult, shiftsResult, patientResult, newsResult] = await Promise.all([
    // Offene Materialbestellungen
    supabase
      .from('inventory')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'offen'),

    // Schichten von HEUTE mit korrektem Server-seitigem Join
    // Fix: Nur aktive Schichten (status = 'aktiv') werden als "im Haus" gezählt
    supabase
      .from('shifts')
      .select('*, profiles!shifts_user_id_fkey(full_name)')
      .eq('date', todayStr)
      .eq('status', 'aktiv'),

    // Patientenaufnahmen von heute (anonymer Zähler)
    supabase
      .from('patient_intakes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay),

    // Pinnwand-Nachrichten
    supabase
      .from('news_board')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const orderCount = ordersResult.count ?? 0
  const workingToday = (shiftsResult.data ?? []) as any[]
  const patientCount = patientResult.count ?? 0
  const news = (newsResult.data ?? []) as any[]

  const isAdmin =
    profile.role?.slug === 'super_admin' || profile.role?.slug === 'it_admin'

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
        <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-start mb-6">
            <div className={cn('p-4 rounded-2xl', orderCount > 0 ? 'bg-rose-50 text-rose-500' : 'bg-zinc-50 text-zinc-400')}>
              <AlertCircle size={28} strokeWidth={2.5} />
            </div>
            <span className="text-5xl font-black text-zinc-900 tracking-tighter">{orderCount}</span>
          </div>
          <div>
            <h3 className="font-extrabold text-zinc-900 text-lg">Einkaufsliste</h3>
            <p className={cn('text-sm font-medium mt-1', orderCount > 0 ? 'text-rose-500' : 'text-zinc-400')}>
              {orderCount > 0 ? 'Artikel müssen bestellt werden' : 'Lagerbestände sind optimal'}
            </p>
          </div>
        </div>

        {/* Widget 2: Heute im Haus */}
        <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl">
              <Users size={28} strokeWidth={2.5} />
            </div>
            <span className="text-5xl font-black text-zinc-900 tracking-tighter">{workingToday.length}</span>
          </div>
          <div>
            <h3 className="font-extrabold text-zinc-900 text-lg">Heute im Haus</h3>
            <p className="text-sm font-medium text-zinc-500 mt-1 truncate">
              {workingToday.length > 0
                ? workingToday.map((s: any) => s.profiles?.full_name?.split(' ')[0] || 'Teammitglied').join(', ')
                : 'Noch niemand eingeteilt'}
            </p>
          </div>
        </div>

        {/* Widget 3: Patienten */}
        <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-indigo-50 text-indigo-500 rounded-2xl">
              <FileText size={28} strokeWidth={2.5} />
            </div>
            <span className="text-5xl font-black text-zinc-900 tracking-tighter">{patientCount}</span>
          </div>
          <div>
            <h3 className="font-extrabold text-zinc-900 text-lg">Neuaufnahmen</h3>
            <p className="text-sm font-medium text-zinc-400 mt-1">Erfasste Formulare (Heute)</p>
          </div>
        </div>
      </div>

      {/* 3. PINNWAND (Client Component — nur dieser Teil ist interaktiv) */}
      <NewsBoardClient
        initialNews={news}
        currentUserId={profile.id}
        isAdmin={isAdmin}
      />

    </div>
  )
}