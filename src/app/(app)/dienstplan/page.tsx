import Link from 'next/link'
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
import { getBerlinHolidays } from '@/lib/holidays'
import { cn, sortShifts } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  searchParams: Promise<{ role?: string, view?: string, date?: string }>
}

export default async function DienstplanPage({ searchParams }: Props) {
  const supabase = await createClient()
  const params = await searchParams
  const selectedRole = params.role
  const currentView = params.view || 'monat'
  
  const searchDate = params.date ? new Date(`${params.date}T12:00:00`) : new Date()
  searchDate.setHours(12, 0, 0, 0)
  
  const year = searchDate.getFullYear()
  const month = searchDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  
  const fetchStart = new Date(year, month, 1)
  fetchStart.setDate(fetchStart.getDate() - 7)
  const fetchEnd = new Date(year, month + 1, 0)
  fetchEnd.setDate(fetchEnd.getDate() + 7)
  
  const startIso = fetchStart.toISOString().split('T')[0]
  const endIso = fetchEnd.toISOString().split('T')[0]

  let prevDateStr = ''
  let nextDateStr = ''

  if (currentView === 'tag') {
    const p = new Date(searchDate); p.setDate(p.getDate() - 1);
    const n = new Date(searchDate); n.setDate(n.getDate() + 1);
    prevDateStr = p.toISOString().split('T')[0]
    nextDateStr = n.toISOString().split('T')[0]
  } else if (currentView === 'woche') {
    const p = new Date(searchDate); p.setDate(p.getDate() - 7);
    const n = new Date(searchDate); n.setDate(n.getDate() + 7);
    prevDateStr = p.toISOString().split('T')[0]
    nextDateStr = n.toISOString().split('T')[0]
  } else {
    const p = new Date(year, month - 1, 1, 12);
    const n = new Date(year, month + 1, 1, 12);
    prevDateStr = p.toISOString().split('T')[0]
    nextDateStr = n.toISOString().split('T')[0]
  }

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
  const holidays = getBerlinHolidays(year)

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 min-h-screen print:min-h-0">
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: landscape; margin: 1cm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          html, body, main { height: auto !important; overflow: visible !important; }
        }
      `}} />
      
      {/* NEUER SAUBERER HEADER BEREICH */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 print:hidden">
        
        <div className="flex items-center gap-3 w-full xl:w-auto justify-between xl:justify-start">
          <div className="flex items-center gap-2">
            <Link 
              href={`?view=${currentView}&date=${prevDateStr}`} 
              className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </Link>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight w-[160px] sm:w-[200px] text-center">
              {searchDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
            </h1>
            
            <Link 
              href={`?view=${currentView}&date=${nextDateStr}`} 
              className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </Link>
          </div>

          <div className="hidden sm:block border-l-2 border-emerald-500/30 pl-4 py-1">
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Dienstplan</p>
            <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">Praxis-Besetzung</p>
          </div>
        </div>
        
        {/* Kontroll-Elemente */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full xl:w-auto">
          <PrintButton />
          <RoleFilter />
          <ViewToggle />
          <div className="ml-auto sm:ml-0">
            <AddShiftDialog 
              profiles={profiles || []} 
              defaultDate={params.date || new Date().toISOString().split('T')[0]} 
            />
          </div>
        </div>
      </div>

      {currentView === 'tag' && (
        <DayView 
          dateStr={params.date || new Date().toISOString().split('T')[0]} 
          shifts={sortShifts(shifts)} 
          profiles={profiles || []} 
        />
      )}

      {currentView === 'woche' && (
        <WeekView 
          dateStr={params.date || new Date().toISOString().split('T')[0]} 
          shifts={sortShifts(shifts)} 
          profiles={profiles || []} 
        />
      )}

      {currentView === 'monat' && (
        <div className="w-full">
          <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-none sm:rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 min-h-[calc(100vh-12rem)] flex flex-col print:min-h-0 print:border-none print:shadow-none">
            <CardContent className="p-0 flex flex-col flex-1">
              
              {/* Wochentage */}
              <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/80 text-center py-1 sm:py-3 print:bg-zinc-100/50">
                {weekdays.map((day) => (
                  <span key={day} className="text-[10px] sm:text-xs font-semibold text-zinc-600 dark:text-zinc-400 print:text-black">{day}</span>
                ))}
              </div>

              {/* Raster */}
              <div className="grid grid-cols-7 flex-1 divide-x divide-y divide-zinc-100 dark:divide-zinc-800 auto-rows-[minmax(80px,_1fr)] sm:auto-rows-[minmax(140px,_1fr)] print:auto-rows-auto print:divide-zinc-300">
                {calendarCells.map((cell, idx) => {
                  const rawDayShifts = shifts.filter((s: any) => s.date === cell.dateStr)
                  const dayShifts = sortShifts(rawDayShifts)
                  const holiday = holidays.find(h => h.date === cell.dateStr)

                  if (!cell.dayNum) {
                    return <div key={idx} className="p-0.5 sm:p-2 bg-zinc-50/30 dark:bg-zinc-950/40 text-transparent select-none print:bg-transparent" />
                  }

                  return (
                    <div key={idx} className={cn("p-0.5 sm:p-2 flex flex-col transition-colors bg-white dark:bg-zinc-900 overflow-hidden print:h-auto print:overflow-visible print:break-inside-avoid print:p-1.5", cell.isToday && "bg-emerald-50/10 dark:bg-emerald-950/20 print:bg-transparent", holiday && "bg-rose-50/10 dark:bg-rose-950/20")}>
                      
                      <AddShiftDialog
                        profiles={profiles || []}
                        defaultDate={cell.dateStr || ''}
                        trigger={
                          <button 
                            type="button" 
                            className="w-full block flex justify-between items-center mb-0.5 sm:mb-1 shrink-0 cursor-pointer rounded-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 p-0.5 sm:p-0.5 -mt-0.5 -mx-0.5 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-0.5 sm:gap-1.5 w-full">
                              <span className={cn("text-[10px] sm:text-[11px] font-bold w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full text-zinc-700 dark:text-zinc-300 print:text-black", cell.isToday && "bg-emerald-600 text-white shadow-md print:bg-transparent print:text-black", holiday && "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 shadow-none font-extrabold print:bg-transparent print:text-rose-600")}>
                                {cell.dayNum}
                              </span>
                              {holiday && (
                                <span className="text-[7px] sm:text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-950/80 px-1 sm:px-1.5 py-0 sm:py-0.5 rounded truncate w-full sm:w-auto text-center sm:text-left">
                                  {holiday.name}
                                </span>
                              )}
                            </div>
                          </button>
                        }
                      />

                      <div className="flex-1 flex flex-col space-y-0.5 sm:space-y-1 pr-0 sm:pr-1 custom-scrollbar print:space-y-0.5 print:pr-0 overflow-y-hidden sm:overflow-y-auto">
                        {dayShifts.map((shift: any) => (
                          <EditShiftDialog key={shift.id} shift={shift} profiles={profiles || []} />
                        ))}
                        
                        <AddShiftDialog
                          profiles={profiles || []}
                          defaultDate={cell.dateStr || ''}
                          trigger={
                            <button 
                              type="button" 
                              className="block flex-1 w-full min-h-[1rem] sm:min-h-[1.5rem] cursor-pointer rounded-md hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 mt-1 transition-colors border-none bg-transparent print:hidden" 
                            />
                          }
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  )
}