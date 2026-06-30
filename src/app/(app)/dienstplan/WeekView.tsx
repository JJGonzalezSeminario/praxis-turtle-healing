'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { EditShiftDialog } from './EditShiftDialog'
import { AddShiftDialog } from './AddShiftDialog'
import { cn, sortShifts } from '@/lib/utils'

export function WeekView({ dateStr, shifts, profiles }: { dateStr: string, shifts: any[], profiles: any[] }) {
  // 1. Finde den Montag der aktuellen Woche
  const currentDate = new Date(`${dateStr}T12:00:00`)
  const dayOfWeek = currentDate.getDay() // 0 = Sonntag, 1 = Montag etc.
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() + diffToMonday)

  // 2. Berechne vorherige und nächste Woche für die Pfeile
  const prevWeek = new Date(startOfWeek)
  prevWeek.setDate(prevWeek.getDate() - 7)
  const nextWeek = new Date(startOfWeek)
  nextWeek.setDate(nextWeek.getDate() + 7)

  // 3. Baue ein Array mit den 7 Tagen der Woche
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return {
      dateObj: d,
      isoStr: d.toISOString().split('T')[0],
      isToday: d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
    }
  })

  const weekdaysDe = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-300">
      
      {/* Header mit Wochen-Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50/50">
        <Link href={`?view=woche&date=${prevWeek.toISOString().split('T')[0]}`} className="p-2 hover:bg-zinc-200 rounded-full transition-colors print:hidden">
          <ChevronLeft size={20} className="text-zinc-600" />
        </Link>
        <h2 className="text-lg font-bold text-zinc-800">
          Woche vom {startOfWeek.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </h2>
        <Link href={`?view=woche&date=${nextWeek.toISOString().split('T')[0]}`} className="p-2 hover:bg-zinc-200 rounded-full transition-colors print:hidden">
          <ChevronRight size={20} className="text-zinc-600" />
        </Link>
      </div>

      {/* Das 7-Tage Raster */}
      <div className="grid grid-cols-7 divide-x divide-zinc-100 min-h-[600px]">
        {weekDays.map((day, idx) => {
          const rawDayShifts = shifts.filter(s => s.date === day.isoStr)
          const dayShifts = sortShifts(rawDayShifts)

          return (
            <div key={day.isoStr} className={cn("flex flex-col transition-colors", day.isToday && "bg-emerald-50/10")}>
              {/* Spaltenkopf (Datum) */}
              <div className="text-center py-3 border-b border-zinc-100 bg-zinc-50/30">
                <div className="text-xs font-semibold text-zinc-500">{weekdaysDe[idx]}</div>
                <div className={cn("text-lg font-bold text-zinc-800 mt-0.5", day.isToday && "text-emerald-600")}>
                  {day.dateObj.getDate()}
                </div>
              </div>

              {/* Schichten & Hinzufügen-Bereich */}
              <div className="flex-1 p-2 flex flex-col gap-1.5">
                {dayShifts.map((shift: any) => (
                  <EditShiftDialog key={shift.id} shift={shift} profiles={profiles} />
                ))}
                
                {/* Unsichtbarer Klick-Bereich zum schnellen Hinzufügen */}
                <AddShiftDialog
                  profiles={profiles}
                  defaultDate={day.isoStr}
                  trigger={
                    <div className="flex-1 w-full min-h-[3rem] cursor-pointer rounded-md hover:bg-zinc-50/80 mt-1 transition-colors print:hidden" />
                  }
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}