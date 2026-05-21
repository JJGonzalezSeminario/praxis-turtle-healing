import { getSessionOrRedirect } from '@/lib/auth/get-session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, ClipboardList, Megaphone } from 'lucide-react'

export default async function DashboardPage() {
  // Profil wird serverseitig geladen (inkl. Name und Rolle)
  const profile = await getSessionOrRedirect()

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Begrüßung */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
          Guten Morgen, {profile.full_name.split(' ')[0]}!
        </h1>
        <p className="text-zinc-500 mt-1 font-medium">
          {new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Doctolib-Style Widget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Widget 1: Dienstplan */}
        <Card className="border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Mein Nächster Dienst
            </CardTitle>
            <Calendar className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">Morgen, 08:00 Uhr</div>
            <p className="text-sm text-zinc-500 mt-1 font-medium">Frühschicht</p>
          </CardContent>
        </Card>

        {/* Widget 2: QM-Checklisten */}
        <Card className="border-cyan-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-cyan-800 uppercase tracking-wider">
              Offene QM-Tasks
            </CardTitle>
            <ClipboardList className="w-5 h-5 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">3 Aufgaben</div>
            <p className="text-sm text-zinc-500 mt-1 font-medium">Fällig bis Ende der Woche</p>
          </CardContent>
        </Card>

        {/* Widget 3: Schwarzes Brett */}
        <Card className="border-rose-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              Schwarzes Brett
            </CardTitle>
            <Megaphone className="w-5 h-5 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">Teammeeting</div>
            <p className="text-sm text-zinc-500 mt-1 font-medium">Heute um 13:00 Uhr im Pausenraum</p>
          </CardContent>
        </Card>
      </div>

      {/* Info-Block für den Super-Admin */}
      {profile.is_super_admin && (
        <div className="mt-8 p-4 bg-zinc-900 rounded-xl text-zinc-400 text-sm">
          <span className="text-white font-bold">Admin-Modus aktiv:</span> Du siehst aktuell das MVP-Dashboard. Später verknüpfen wir diese Kacheln mit echten Live-Daten aus der Datenbank.
        </div>
      )}
    </div>
  )
}