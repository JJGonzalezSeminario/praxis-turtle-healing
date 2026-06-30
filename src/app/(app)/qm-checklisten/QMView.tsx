'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ClipboardList, Lock, FlaskConical, Sun, ArrowRight, ArrowLeft, Check, Repeat, Activity, ChevronRight, ChevronLeft, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, any> = {
  'clipboard-list': ClipboardList,
  'lock': Lock,
  'flask-conical': FlaskConical,
  'sun': Sun,
  'activity': Activity,
  'calendar': Calendar,
  'default': ClipboardList
}

const COLORS = [
  { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { text: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200' },
]

export function QMView({ initialChecklists }: { initialChecklists: any[] }) {
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  
  // States für den Bild-Viewer
  const [activeGuide, setActiveGuide] = useState<{ images: string[], taskText: string, taskId: string } | null>(null)
  const [guideStep, setGuideStep] = useState(0)

  const toggleTask = (taskId: string) => {
    setCheckedItems(prev => ({ ...prev, [taskId]: !prev[taskId] }))
  }

  const resetProcess = (listId: string) => {
    const activeList = initialChecklists.find(l => l.id === listId)
    if (!activeList) return
    const newChecked = { ...checkedItems }
    activeList.checklist_items.forEach((item: any) => {
      newChecked[item.id] = false
    })
    setCheckedItems(newChecked)
  }

  const formatText = (text: string) => {
    if (text.includes('fahrdienst@ganzimmun.de')) {
      const parts = text.split('fahrdienst@ganzimmun.de')
      return <>{parts[0]}<a href="mailto:fahrdienst@ganzimmun.de" onClick={e => e.stopPropagation()} className="text-indigo-600 underline hover:text-indigo-800 font-bold">fahrdienst@ganzimmun.de</a>{parts[1]}</>
    }
    if (text.includes('+49 30 77001250')) {
      const parts = text.split('+49 30 77001250')
      return <>{parts[0]}<a href="tel:+493077001250" onClick={e => e.stopPropagation()} className="text-blue-600 underline hover:text-blue-800 font-bold">+49 30 77001250</a>{parts[1]}</>
    }
    return text
  }

  const openGuide = (images: string[], taskText: string, taskId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Verhindert, dass der Klick auch die Checkbox umschaltet
    setActiveGuide({ images, taskText, taskId })
    setGuideStep(0)
  }

  // ---------------------------------------------
  // BILD-VIEWER (STEP-BY-STEP)
  // ---------------------------------------------
  if (activeGuide) {
    const isLastStep = guideStep === activeGuide.images.length - 1

    return (
      <div className="animate-in zoom-in-95 duration-300 max-w-3xl mx-auto">
        <button 
          onClick={() => setActiveGuide(null)} 
          className="flex items-center gap-2 text-indigo-700 font-bold bg-indigo-50 px-4 py-2 rounded-xl mb-6 hover:bg-indigo-100 transition shadow-sm"
        >
          <ArrowLeft className="w-5 h-5"/> Zurück zur Checkliste
        </button>
        
        <h2 className="text-2xl font-extrabold text-zinc-900 mb-2">{activeGuide.taskText}</h2>
        <p className="text-zinc-500 font-medium mb-6">Schritt {guideStep + 1} von {activeGuide.images.length}</p>

        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-xl border border-zinc-200 flex flex-col items-center">
          <div className="relative w-full aspect-[3/4] sm:aspect-video rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 mb-6">
            <Image 
              src={activeGuide.images[guideStep]} 
              alt={`Schritt ${guideStep + 1}`}
              fill
              className="object-contain"
              unoptimized // Falls die lokalen Bilder keine Next.js Optimierung brauchen
            />
          </div>

          <div className="flex w-full gap-4">
            <button 
              onClick={() => setGuideStep(prev => Math.max(0, prev - 1))}
              disabled={guideStep === 0}
              className="flex-1 bg-zinc-100 text-zinc-600 font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-200 transition flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" /> Zurück
            </button>
            
            {isLastStep ? (
              <button 
                onClick={() => {
                  setCheckedItems(prev => ({ ...prev, [activeGuide.taskId]: true }))
                  setActiveGuide(null)
                }}
                className="flex-1 bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition shadow-md flex items-center justify-center gap-2"
              >
                Erledigt <Check className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={() => setGuideStep(prev => Math.min(activeGuide.images.length - 1, prev + 1))}
                className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition shadow-md flex items-center justify-center gap-2"
              >
                Weiter <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------
  // DETAIL-ANSICHT EINER CHECKLISTE
  // ---------------------------------------------
  if (activeListId) {
    const activeList = initialChecklists.find(l => l.id === activeListId)
    const color = COLORS[initialChecklists.findIndex(l => l.id === activeListId) % COLORS.length]
    const Icon = ICON_MAP[activeList.icon] || ICON_MAP['default']

    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <button 
          onClick={() => setActiveListId(null)} 
          className="flex items-center gap-2 text-zinc-500 font-bold bg-white border border-zinc-200 shadow-sm px-4 py-2 rounded-xl mb-6 hover:bg-zinc-50 hover:text-zinc-800 transition"
        >
          <ArrowLeft className="w-5 h-5"/> Zurück zur Übersicht
        </button>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className={cn("text-2xl sm:text-3xl font-extrabold flex items-center gap-3", color.text)}>
            <Icon size={32} /> {activeList.title}
          </h2>
          <button 
            onClick={() => resetProcess(activeList.id)} 
            className="bg-white border border-zinc-200 text-zinc-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-zinc-50 transition shadow-sm flex items-center gap-2"
          >
            <Repeat className="w-4 h-4"/> Neu starten
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-zinc-200/80">
          {activeList.checklist_items.map((task: any) => {
            const isDone = checkedItems[task.id]
            const hasGuide = task.guide_images && Array.isArray(task.guide_images) && task.guide_images.length > 0

            return (
              <div 
                key={task.id} 
                onClick={() => toggleTask(task.id)} 
                className={cn(
                  "p-5 border-b border-zinc-100 last:border-0 flex items-start sm:items-center gap-4 sm:gap-5 cursor-pointer transition-colors",
                  isDone ? "bg-zinc-50/50 hover:bg-zinc-100" : "hover:bg-zinc-50",
                  hasGuide && !isDone ? "bg-indigo-50/30" : ""
                )}
              >
                <div className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all duration-300 mt-0.5 sm:mt-0", 
                  isDone ? "bg-emerald-500 border-emerald-500 text-white shadow-md scale-110" : "border-zinc-300 bg-zinc-50"
                )}>
                  {isDone && <Check strokeWidth={3} className="w-5 h-5 sm:w-6 sm:h-6" />}
                </div>
                
                <div className="flex-1">
                  <div className={cn("font-bold text-base sm:text-lg transition-all", isDone ? "line-through text-zinc-400" : "text-zinc-800")}>
                    {formatText(task.task_text)}
                  </div>
                  
                  {/* ANLEITUNG BUTTON */}
                  {hasGuide && !isDone && (
                    <button 
                      onClick={(e) => openGuide(task.guide_images, task.task_text, task.id, e)}
                      className="mt-3 flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wide hover:text-indigo-800 transition"
                    >
                      Anleitung ansehen <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ---------------------------------------------
  // HAUPT-ANSICHT (KACHELN)
  // ---------------------------------------------
  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <ClipboardList className="text-emerald-600" size={32} />
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">QM-Checklisten</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialChecklists.map((list, idx) => {
          const color = COLORS[idx % COLORS.length]
          const Icon = ICON_MAP[list.icon] || ICON_MAP['default']
          
          const totalTasks = list.checklist_items.length
          const doneTasks = list.checklist_items.filter((item: any) => checkedItems[item.id]).length
          const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100)

          return (
            <div 
              key={list.id} 
              onClick={() => setActiveListId(list.id)} 
              className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200/80 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className={cn("p-4 rounded-2xl shadow-sm transition group-hover:scale-110", color.bg, color.text)}>
                    <Icon size={28} />
                  </div>
                  <div className="text-zinc-300 group-hover:text-zinc-500 transition">
                    <ArrowRight />
                  </div>
                </div>
                <h3 className="font-extrabold text-xl text-zinc-800 mb-1">{list.title}</h3>
                <p className="text-sm text-zinc-500 font-medium mb-6 line-clamp-2">{list.description}</p>
              </div>
              
              <div>
                <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2">
                  <span>Status</span>
                  <span className={progress === 100 ? 'text-emerald-600' : ''}>
                    {doneTasks} / {totalTasks} erledigt
                  </span>
                </div>
                <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-500", progress === 100 ? 'bg-emerald-500' : color.text.replace('text-', 'bg-'))} 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}