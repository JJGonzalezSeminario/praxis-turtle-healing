'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ClipboardList, Lock, FlaskConical, Sun, ArrowRight, ArrowLeft, Check, Repeat, Activity, ChevronRight, ChevronLeft, Calendar, Search, Play, Image as ImageIcon } from 'lucide-react'
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

function getYouTubeEmbedUrl(url: string) {
  if (!url) return null
  if (url.includes('youtube.com/embed/')) return url
  let videoId = ''
  if (url.includes('youtube.com/watch')) {
    const parts = url.split('?')[1] || ''
    const urlParams = new URLSearchParams(parts)
    videoId = urlParams.get('v') || ''
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || ''
  } else if (url.includes('youtube.com/shorts/')) {
    videoId = url.split('youtube.com/shorts/')[1]?.split('?')[0] || ''
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null
}

const OHT_MEDIA = [
  { type: 'video', title: 'Schulungsvideo 1: Vorbereitung', url: 'https://youtube.com/shorts/tZFGxQyNNJs?feature=share' },
  { type: 'video', title: 'Schulungsvideo 2: Füllung Oval', url: 'https://youtube.com/shorts/gsEmoT3Rr40?feature=share' },
  { type: 'image', title: 'Zusatzbild 3: Starten', url: '/OHT-Infusion/oht_3_starten.jpg' },
  { type: 'image', title: 'Zusatzbild 4: Ozon-Konzentration', url: '/OHT-Infusion/oht_4_ozon.jpg' },
  { type: 'video', title: 'Schulungsvideo 5: Entleeren Oval', url: 'https://youtube.com/shorts/BeXEilUaMZM?feature=share' },
  { type: 'video', title: 'Schulungsvideo 6: Beenden', url: 'https://youtube.com/shorts/R3ypnJ6PcIE?feature=share' },
  { type: 'video', title: 'Schulungsvideo 7: Vitamin C Infusion', url: 'https://youtube.com/shorts/TmAj14TEpxI?feature=share' },
]

export function QMView({ initialChecklists }: { initialChecklists: any[] }) {
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState('')
  
  // States für den Bild-Viewer
  const [activeGuide, setActiveGuide] = useState<{ images: string[], taskText: string, taskId: string } | null>(null)
  const [guideStep, setGuideStep] = useState(0)
  const [activeMedia, setActiveMedia] = useState<{ type: string, title: string, url: string } | null>(null)

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
          <div className="relative w-full aspect-[3/4] sm:aspect-video rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 mb-6 flex items-center justify-center">
            {activeGuide.images[guideStep].endsWith('.mp4') ? (
              <video 
                src={activeGuide.images[guideStep]} 
                controls 
                autoPlay 
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <Image 
                src={activeGuide.images[guideStep]} 
                alt={`Schritt ${guideStep + 1}`}
                fill
                className="object-contain"
                unoptimized // Falls die lokalen Bilder keine Next.js Optimierung brauchen
              />
            )}
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
  // DETAIL-ANSICHT EINER CHECKLISTE ODER EINES PROTOKOLLS
  // ---------------------------------------------
  if (activeListId) {
    const activeList = initialChecklists.find(l => l.id === activeListId)
    const color = COLORS[initialChecklists.findIndex(l => l.id === activeListId) % COLORS.length]
    const Icon = ICON_MAP[activeList?.icon] || ICON_MAP['default']

    if (activeList?.isProtocol) {
      return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <button 
            onClick={() => setActiveListId(null)} 
            className="flex items-center gap-2 text-zinc-500 font-bold bg-white border border-zinc-200 shadow-sm px-4 py-2 rounded-xl mb-6 hover:bg-zinc-50 hover:text-zinc-800 transition"
          >
            <ArrowLeft className="w-5 h-5"/> Zurück zur Übersicht
          </button>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full border border-indigo-200 mb-2">
                <FlaskConical size={14} /> Infusions- & Therapiestandard
              </span>
              <h2 className={cn("text-2xl sm:text-3xl font-extrabold flex items-center gap-3", color.text)}>
                <Icon size={32} /> {activeList.title}
              </h2>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-zinc-200/80 mb-6">
            <p className="text-zinc-600 font-medium text-base mb-8 pb-4 border-b border-zinc-100">
              {activeList.description}
            </p>

            <div className="space-y-6">
              {activeList.protocol_steps.map((step: any) => (
                <div key={step.step} className="bg-zinc-50/80 border border-zinc-200/80 rounded-2xl p-5 sm:p-6 transition-all hover:bg-white hover:shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-zinc-900 text-white font-extrabold flex items-center justify-center text-sm shadow-sm shrink-0">
                        {step.step}
                      </span>
                      <h3 className="font-extrabold text-lg text-zinc-900">{step.title}</h3>
                    </div>
                    {step.badge && (
                      <span className={cn("px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto", step.badgeColor)}>
                        {step.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-zinc-600 text-sm font-medium mb-3 sm:pl-11">
                    {step.details}
                  </p>

                  {step.subItems && step.subItems.length > 0 && (
                    <div className="sm:pl-11 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {step.subItems.map((sub: any, sIdx: number) => (
                        <div key={sIdx} className="bg-white border border-zinc-200/90 rounded-xl p-3 shadow-2xs flex items-center gap-3">
                          <span className="px-2.5 py-1 bg-zinc-100 text-zinc-800 font-extrabold text-xs rounded-md uppercase tracking-wider shrink-0">
                            {sub.label}
                          </span>
                          <span className="text-sm font-bold text-zinc-800">
                            {sub.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Schulungsmedien & Referenzen am Ende des OHT-Ablaufs */}
          {activeList.id === 'oht-checklist' && (
            <div className="mt-8 bg-white rounded-3xl p-6 shadow-sm border border-zinc-200/80 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h3 className="text-xl font-extrabold text-zinc-900 mb-2 flex items-center gap-2">
                <Play className="text-indigo-600 w-5.5 h-5.5" /> Schulungsmedien & Bild-Referenzen
              </h3>
              <p className="text-sm text-zinc-500 font-medium mb-6">
                Nutzen Sie diese Videos und Zusatzbilder zur visuellen Unterstützung und Einarbeitung.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {OHT_MEDIA.map((media, idx) => {
                  const Icon = media.type === 'video' ? Play : ImageIcon
                  return (
                    <div 
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveMedia(media)
                      }}
                      className="flex items-center gap-3 p-4 bg-zinc-50 hover:bg-indigo-50/50 border border-zinc-100 hover:border-indigo-100 rounded-2xl cursor-pointer transition group"
                    >
                      <div className="p-3 bg-white group-hover:bg-indigo-600 group-hover:text-white rounded-xl shadow-sm text-zinc-600 transition shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-0.5">
                          {media.type === 'video' ? 'Video' : 'Bild'}
                        </p>
                        <p className="text-sm font-bold text-zinc-800 truncate group-hover:text-indigo-900 transition">
                          {media.title}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )
    }

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

        {/* Schulungsmedien & Referenzen am Ende des OHT-Ablaufs */}
        {activeList.id === 'oht-checklist' && (
          <div className="mt-8 bg-white rounded-3xl p-6 shadow-sm border border-zinc-200/80 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-xl font-extrabold text-zinc-900 mb-2 flex items-center gap-2">
              <Play className="text-indigo-600 w-5.5 h-5.5" /> Schulungsmedien & Bild-Referenzen
            </h3>
            <p className="text-sm text-zinc-500 font-medium mb-6">
              Nutzen Sie diese Videos und Zusatzbilder zur visuellen Unterstützung und Einarbeitung.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {OHT_MEDIA.map((media, idx) => {
                const Icon = media.type === 'video' ? Play : ImageIcon
                return (
                  <div 
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveMedia(media)
                    }}
                    className="flex items-center gap-3 p-4 bg-zinc-50 hover:bg-indigo-50/50 border border-zinc-100 hover:border-indigo-100 rounded-2xl cursor-pointer transition group"
                  >
                    <div className="p-3 bg-white group-hover:bg-indigo-600 group-hover:text-white rounded-xl shadow-sm text-zinc-600 transition shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-0.5">
                        {media.type === 'video' ? 'Video' : 'Bild'}
                      </p>
                      <p className="text-sm font-bold text-zinc-800 truncate group-hover:text-indigo-900 transition">
                        {media.title}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Modaler Player für Schulungsmedien & Zusatzbilder (für Detailansicht) */}
        {activeMedia && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl relative flex flex-col max-h-[90vh]">
              <div className="p-5 flex justify-between items-center border-b border-zinc-800">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {activeMedia.type === 'video' ? <Play className="w-5 h-5 text-indigo-400" /> : <ImageIcon className="w-5 h-5 text-indigo-400" />}
                  {activeMedia.title}
                </h3>
                <button 
                  onClick={() => setActiveMedia(null)}
                  className="text-zinc-400 hover:text-white bg-zinc-800/80 px-4 py-2 rounded-xl transition text-sm font-bold"
                >
                  Schließen ✕
                </button>
              </div>
              
              <div className="flex-1 bg-zinc-950 flex items-center justify-center overflow-hidden p-2 min-h-[300px]">
                {getYouTubeEmbedUrl(activeMedia.url) ? (
                  <iframe 
                    src={getYouTubeEmbedUrl(activeMedia.url)!} 
                    className="w-full aspect-video rounded-2xl border-0 max-h-[70vh]" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                ) : activeMedia.type === 'video' ? (
                  <video 
                    src={encodeURI(activeMedia.url)} 
                    controls 
                    autoPlay
                    className="max-h-[70vh] w-full object-contain"
                  />
                ) : (
                  <div className="relative w-full h-[70vh]">
                    <Image 
                      src={encodeURI(activeMedia.url)} 
                      alt={activeMedia.title}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const filteredChecklists = initialChecklists.filter(list => 
    list.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (list.description && list.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (list.checklist_items && list.checklist_items.some((item: any) => item.task_text.toLowerCase().includes(searchTerm.toLowerCase()))) ||
    (list.protocol_steps && list.protocol_steps.some((step: any) => 
      step.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      step.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (step.subItems && step.subItems.some((sub: any) => sub.text.toLowerCase().includes(searchTerm.toLowerCase())))
    ))
  )

  // ---------------------------------------------
  // HAUPT-ANSICHT (KACHELN)
  // ---------------------------------------------
  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-col sm:flex-row gap-4 mb-8">
        <div className="flex items-center gap-3">
          <ClipboardList className="text-emerald-600" size={32} />
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">QM-Checklisten</h1>
        </div>
      </div>

      {/* SUCHLEISTE: Schwebender Effekt */}
      <div className="relative mb-10 group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="text-zinc-400 group-focus-within:text-emerald-600 transition-colors" size={22} />
        </div>
        <input 
          type="text"
          placeholder="Suchen nach Checklisten, Beschreibungen oder Aufgaben..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl border-0 ring-1 ring-zinc-200 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white text-lg placeholder:text-zinc-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredChecklists.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-zinc-200 border-dashed">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-zinc-400" size={28} />
          </div>
          <p className="text-zinc-500 font-medium text-lg">Keine Checklisten für diese Suche gefunden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChecklists.map((list, idx) => {
            const color = COLORS[idx % COLORS.length]
            const Icon = ICON_MAP[list.icon] || ICON_MAP['default']
            
            if (list.isProtocol) {
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
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full border border-indigo-200 flex items-center gap-1">
                        <FlaskConical size={12} /> Protokoll
                      </span>
                    </div>
                    <h3 className="font-extrabold text-xl text-zinc-800 mb-1">{list.title}</h3>
                    <p className="text-sm text-zinc-500 font-medium mb-6 line-clamp-2">{list.description}</p>
                  </div>
                  
                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400">Infusionsanweisung</span>
                    <span className="text-xs font-bold text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1">
                      Protokoll öffnen <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              )
            }

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
      )}

      {/* Modaler Player für Schulungsmedien & Zusatzbilder */}
      {activeMedia && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="p-5 flex justify-between items-center border-b border-zinc-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {activeMedia.type === 'video' ? <Play className="w-5 h-5 text-indigo-400" /> : <ImageIcon className="w-5 h-5 text-indigo-400" />}
                {activeMedia.title}
              </h3>
              <button 
                onClick={() => setActiveMedia(null)}
                className="text-zinc-400 hover:text-white bg-zinc-800/80 px-4 py-2 rounded-xl transition text-sm font-bold"
              >
                Schließen ✕
              </button>
            </div>
            
            <div className="flex-1 bg-zinc-950 flex items-center justify-center overflow-hidden p-2 min-h-[300px]">
              {getYouTubeEmbedUrl(activeMedia.url) ? (
                <iframe 
                  src={getYouTubeEmbedUrl(activeMedia.url)!} 
                  className="w-full aspect-video rounded-2xl border-0 max-h-[70vh]" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                />
              ) : activeMedia.type === 'video' ? (
                <video 
                  src={encodeURI(activeMedia.url)} 
                  controls 
                  autoPlay
                  className="max-h-[70vh] w-full object-contain"
                />
              ) : (
                <div className="relative w-full h-[70vh]">
                  <Image 
                    src={encodeURI(activeMedia.url)} 
                    alt={activeMedia.title}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}