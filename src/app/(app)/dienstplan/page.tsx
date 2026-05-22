import { getShifts } from '@/lib/data/shifts'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { AddShiftDialog } from './AddShiftDialog'
import { EditShiftDialog } from './EditShiftDialog'
import { RoleFilter } from './RoleFilter'
import { ViewToggle } from './ViewToggle'
import { DayView } from './DayView'
import { WeekView } from './WeekView'
import { PrintButton } from './PrintButton'
import { cn } from '@/lib/utils'

type Props = {
  searchParams: Promise<{ role?: string, view?: string, date?: string }>
}

export default async function DienstplanPage({ searchParams }: Props) {
  const supabase = await createClient()
  const params = await searchParams
  const selectedRole = params.role
  const currentView = params.view || 'monat'
  
  // Das Zieldatum bestimmen (wichtig, falls man in der Tagesansicht einen anderen Monat aufruft)
  const searchDate = params.date ? new Date(params.date) : new Date()
  const year = searchDate.getFullYear()
  const month = searchDate.getMonth()

  // Monatsgrenzen bestimmen
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  
  // Wir laden immer den aktuellen Monat PLUS 7 Tage Puffer davor und danach, 
  // damit Wochen, die in den nächsten Monat ragen, fehlerfrei angezeigt werden.
  const fetchStart = new Date(year, month, 1)
  fetchStart.setDate(fetchStart.getDate() - 7)
  const fetchEnd = new Date(year, month + 1, 0)
  fetchEnd.setDate(fetchEnd.getDate() + 7)
  
  const startIso = fetchStart.toISOString().split('T')[0]
  const endIso = fetchEnd.toISOString().split('T')[0]

  let shifts = await getShifts(startIso, endIso)
  
  if (selectedRole) {
    shifts = shifts.filter((s: any) => s.profiles?.roles?.slug === selectedRole)
  }

  const { data: profiles } = await supabase.from('profiles').select('id, full_name, roles(name)').order('full_name')

  const daysInMonth = lastDayOfMonth.getDate()
  const dayOffset = (firstDayOfMonth.getDay() + 6) % 7

  const calendarCells = []
  for (let i = 0; i < dayOffset; i++) {
    calendarCells.push({ dateStr: null, dayNum: null })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const currentStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    calendarCells.push({
      dateStr: currentStr,
      dayNum: d,
      isToday: d === new Date().getDate() && month === new Date().getMonth()
    })
  }

  const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            {searchDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
          </h1>
          <p className="text-sm text-zinc-500 mt-1 print:hidden">Praxis-Schichtplan und Besetzung</p>
        </div>
        
        {/* Kontrollzentrum: Filter, Umschalter & Neuer Eintrag */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start print:hidden">
          <PrintButton />
          <RoleFilter />
          <ViewToggle />
          <AddShiftDialog 
            profiles={profiles || []} 
            defaultDate={params.date || new Date().toISOString().split('T')[0]} 
          />
        </div>
      </div>

      {/* Logik: Entweder Tag, Woche oder Monat rendern! */}
      {currentView === 'tag' && (
        <DayView 
          dateStr={params.date || new Date().toISOString().split('T')[0]} 
          shifts={shifts} 
          profiles={profiles || []} 
        />
      )}

      {currentView === 'woche' && (
        <WeekView 
          dateStr={params.date || new Date().toISOString().split('T')[0]} 
          shifts={shifts} 
          profiles={profiles || []} 
        />
      )}

      {currentView === 'monat' && (
        <Card className="border-zinc-200/80 shadow-sm rounded-2xl overflow-hidden bg-white flex flex-col min-h-[calc(100vh-10rem)] print:min-h-0">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50/70 text-center py-3">
              {weekdays.map((day) => (
                <span key={day} className="text-xs font-semibold text-zinc-600">{day}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-[140px] divide-x divide-y divide-zinc-100">
              {calendarCells.map((cell, idx) => {
                const dayShifts = shifts.filter((s: any) => s.date === cell.dateStr)

                if (!cell.dayNum) {
                  return <div key={idx} className="p-2 bg-zinc-50/30 text-transparent select-none" />
                }

                return (
                  <div key={idx} className={cn("p-2 flex flex-col transition-colors bg-white overflow-hidden", cell.isToday && "bg-emerald-50/10")}>
                    
                    <AddShiftDialog
                      profiles={profiles || []}
                      defaultDate={cell.dateStr || ''}
                      trigger={
                        <div className="flex justify-between items-center mb-1.5 shrink-0 cursor-pointer rounded-md hover:bg-zinc-100 p-1 -mt-1 -mx-1 transition-colors">
                          <span className={cn("text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full text-zinc-700", cell.isToday && "bg-emerald-600 text-white shadow-md")}>
                            {cell.dayNum}
                          </span>
                        </div>
                      }
                    />

                    <div className="flex-1 flex flex-col overflow-y-auto print:overflow-visible print:max-h-none pr-1 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent">
                      <div className="space-y-1.5">
                        {dayShifts.map((shift: any) => (
                          <EditShiftDialog key={shift.id} shift={shift} profiles={profiles || []} />
                        ))}
                      </div>

                      <AddShiftDialog
                        profiles={profiles || []}
                        defaultDate={cell.dateStr || ''}
                        trigger={
                          <div className="flex-1 w-full min-h-[2rem] cursor-pointer rounded-md hover:bg-zinc-50/80 mt-1 transition-colors print:hidden" />
                        }
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}