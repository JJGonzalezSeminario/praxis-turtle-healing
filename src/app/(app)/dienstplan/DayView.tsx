'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, UserCircle2 } from 'lucide-react'
import { EditShiftDialog } from './EditShiftDialog'

export function DayView({ dateStr, shifts, profiles }: { dateStr: string, shifts: any[], profiles: any[] }) {
  // Zustand für die aktuelle Uhrzeit (wird jede Minute aktualisiert)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 60000) // Alle 60 Sekunden aktualisieren
    return () => clearInterval(timer)
  }, [])

  const currentDate = new Date(`${dateStr}T12:00:00`)
  const prevDate = new Date(currentDate)
  prevDate.setDate(prevDate.getDate() - 1)
  const nextDate = new Date(currentDate)
  nextDate.setDate(nextDate.getDate() + 1)

  const prevStr = prevDate.toISOString().split('T')[0]
  const nextStr = nextDate.toISOString().split('T')[0]

  const dayShifts = shifts.filter(s => s.date === dateStr)
  const activeShifts = dayShifts.filter(s => s.status === 'aktiv')
  const absentShifts = dayShifts.filter(s => s.status !== 'aktiv')

  const shiftsByUser = activeShifts.reduce((acc: any, shift: any) => {
    if (!acc[shift.user_id]) acc[shift.user_id] = []
    acc[shift.user_id].push(shift)
    return acc
  }, {})

  // Timeline-Einstellungen: 07:00 bis 19:00 Uhr
  const startHour = 7
  const endHour = 19
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)
  const totalMinutes = (endHour - startHour) * 60

  // Berechnet die Position der Schicht-Kacheln
  const getStyles = (start: string, end: string) => {
    const getMins = (t: string) => {
      const [h, m] = t.split(':').map(Number)
      return (h * 60 + m) - (startHour * 60)
    }
    const startMins = Math.max(0, getMins(start))
    const endMins = Math.min(totalMinutes, getMins(end))
    const left = (startMins / totalMinutes) * 100
    const width = ((endMins - startMins) / totalMinutes) * 100
    return { left: `${left}%`, width: `${width}%` }
  }

  // NEU: Berechnet die exakte X-Position der roten "Jetzt"-Linie
  const getNowLineLeft = () => {
    const isToday = dateStr === new Date().toISOString().split('T')[0]
    if (!isToday) return null // Nur am heutigen Tag anzeigen

    const currentMins = (now.getHours() * 60 + now.getMinutes()) - (startHour * 60)
    if (currentMins < 0 || currentMins > totalMinutes) return null // Außerhalb von 07:00 - 19:00 Uhr ausblenden

    return `${(currentMins / totalMinutes) * 100}%`
  }

  const nowLineLeft = getNowLineLeft()

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-300">
      
      {/* Header mit Tag-Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50/50">
        <Link href={`?view=tag&date=${prevStr}`} className="p-2 hover:bg-zinc-200 rounded-full transition-colors print:hidden">
          <ChevronLeft size={20} className="text-zinc-600" />
        </Link>
        <h2 className="text-lg font-bold text-zinc-800">
          {currentDate.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </h2>
        <Link href={`?view=tag&date=${nextStr}`} className="p-2 hover:bg-zinc-200 rounded-full transition-colors print:hidden">
          <ChevronRight size={20} className="text-zinc-600" />
        </Link>
      </div>

      {/* Ausfälle */}
      {absentShifts.length > 0 && (
        <div className="p-4 border-b border-zinc-100 bg-red-50/30">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Ganztägige Ausfälle</h3>
          <div className="flex flex-wrap gap-2">
            {absentShifts.map((shift: any) => (
              <div key={shift.id} className="w-48">
                <EditShiftDialog shift={shift} profiles={profiles} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Das Zeitstrahl-Raster */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px] relative"> {/* relative ist wichtig für die absolute rote Linie! */}
          
          {/* Spaltenköpfe (Die Uhrzeiten) */}
          <div className="flex border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-500">
            <div className="w-56 shrink-0 p-3 border-r border-zinc-200">Mitarbeiter</div>
            <div className="flex-1 flex relative">
              {hours.slice(0, -1).map(h => (
                <div key={h} className="flex-1 p-2 border-r border-zinc-100 last:border-r-0">
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          {/* Der Timeline-Body */}
          <div className="relative">
            
            {/* NEU: DIE ROTE ECHTZEIT-LINIE */}
            {nowLineLeft && (
              <div 
                className="absolute top-0 bottom-0 z-30 w-0.5 bg-red-500 pointer-events-none transition-all duration-500"
                style={{ left: `calc(14rem + (100% - 14rem) * ${nowLineLeft.replace('%', '')} / 100)` }}
              >
                {/* Kleiner roter Bobbel oben auf der Linie */}
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-red-500 shadow-md" />
              </div>
            )}

            {/* Die Zeilen der Mitarbeiter */}
            {Object.keys(shiftsByUser).length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-sm">Keine aktiven Schichten an diesem Tag.</div>
            ) : (
              Object.entries(shiftsByUser).map(([userId, userShifts]: [string, any]) => {
                const user = userShifts[0].profiles
                const roleName = user.roles?.name || 'Mitarbeiter'
                
                return (
                  <div key={userId} className="flex border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors group">
                    {/* Linke Spalte: Wer arbeitet? */}
                    <div className="w-56 shrink-0 p-3 border-r border-zinc-200 flex items-center gap-3 bg-white group-hover:bg-zinc-50/50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 shrink-0">
                        <UserCircle2 size={18} />
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-semibold text-zinc-800 truncate">{user.full_name}</div>
                        <div className="text-[10px] uppercase tracking-wide font-bold text-zinc-400 truncate">{roleName}</div>
                      </div>
                    </div>

                    {/* Rechte Spalte: Wann arbeitet er? */}
                    <div className="flex-1 relative flex min-h-[4rem]">
                      {/* Die zarten, vertikalen Rasterlinien im Hintergrund */}
                      {hours.slice(0, -1).map(h => (
                        <div key={h} className="flex-1 border-r border-zinc-100 last:border-r-0" />
                      ))}
                      
                      {/* Die berechneten, farbigen Schicht-Blöcke */}
                      {userShifts.map((shift: any) => {
                        const style = getStyles(shift.start_time, shift.end_time)
                        return (
                          <div key={shift.id} className="absolute top-1/2 -translate-y-1/2 z-10 px-1" style={style}>
                            <EditShiftDialog shift={shift} profiles={profiles} />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>

        </div>
      </div>
    </div>
  )
}