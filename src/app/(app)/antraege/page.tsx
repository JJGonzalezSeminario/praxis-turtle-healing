'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  CalendarClock, Plus, CheckCircle2, XCircle, Clock, 
  Palmtree, RefreshCcw, GraduationCap, Stethoscope, 
  CalendarDays, X
} from 'lucide-react'
import { cn } from '@/lib/utils'

const calculateDays = (start: string, end: string) => {
  const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

const TYPE_CONFIG: Record<string, { icon: any, color: string, bg: string }> = {
  'Urlaub': { icon: Palmtree, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'Schichtwechsel': { icon: RefreshCcw, color: 'text-blue-600', bg: 'bg-blue-50' },
  'Fortbildung': { icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  'Krankmeldung': { icon: Stethoscope, color: 'text-rose-600', bg: 'bg-rose-50' }
}

export default function AntraegePage() {
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'Admin' | 'Mitarbeiter'>('Mitarbeiter')
  const [userId, setUserId] = useState<string | null>(null)
  
  const [requests, setRequests] = useState<any[]>([])
  const [leaveBalance, setLeaveBalance] = useState({ total: 25, used: 0 })
  
  // NEU: Filter-State für den Admin
  const [adminFilter, setAdminFilter] = useState<'ausstehend' | 'historie' | 'alle'>('ausstehend')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    type: 'Urlaub', start_date: '', end_date: '', user_comment: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUserId(user.id)

    const { data: profile } = await supabase.from('profiles').select('*, roles(name)').eq('id', user.id).single()
    const isUserAdmin = profile?.roles?.slug === 'super_admin' || profile?.roles?.slug === 'arzt' || profile?.roles?.slug === 'it_admin'
    setRole(isUserAdmin ? 'Admin' : 'Mitarbeiter')

    const currentYear = new Date().getFullYear()

    if (isUserAdmin) {
      // ADMIN: Lädt jetzt ALLE Anträge, der Filter (ausstehend) wurde hier entfernt!
      const { data: allRequests } = await supabase
        .from('requests')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
      setRequests(allRequests || [])
    } else {
      const { data: myRequests } = await supabase
        .from('requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setRequests(myRequests || [])

      const { data: balance } = await supabase.from('leave_balances').select('*').eq('user_id', user.id).eq('year', currentYear).single()
      if (balance) {
        setLeaveBalance({ total: balance.total_days, used: balance.used_days })
      } else {
        await supabase.from('leave_balances').insert([{ user_id: user.id, year: currentYear }])
      }
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.start_date || !formData.end_date) return

    const { error } = await supabase.from('requests').insert([{
      user_id: userId,
      type: formData.type,
      start_date: formData.start_date,
      end_date: formData.end_date,
      user_comment: formData.user_comment,
      status: 'ausstehend'
    }])

    if (!error) {
      setIsModalOpen(false)
      setFormData({ type: 'Urlaub', start_date: '', end_date: '', user_comment: '' })
      fetchData()
    } else {
      alert("Fehler beim Senden des Antrags: " + error.message)
    }
  }

  const handleAction = async (requestId: string, action: 'genehmigt' | 'abgelehnt', reqUserId: string, reqType: string, start: string, end: string) => {
    await supabase.from('requests').update({ status: action }).eq('id', requestId)

    if (action === 'genehmigt' && reqType === 'Urlaub') {
      const days = calculateDays(start, end)
      const currentYear = new Date().getFullYear()
      
      const { data: balance } = await supabase.from('leave_balances').select('used_days').eq('user_id', reqUserId).eq('year', currentYear).single()
      
      if (balance) {
        await supabase.from('leave_balances')
          .update({ used_days: balance.used_days + days })
          .eq('user_id', reqUserId).eq('year', currentYear)
      }
    }

    // Lädt die Liste nach der Aktion frisch aus der Datenbank (damit der Status sofort stimmt)
    fetchData()
  }

  // Filter-Logik für die Anzeige
  const filteredRequests = requests.filter(req => {
    if (role === 'Mitarbeiter') return true; // Mitarbeiter sehen immer alles von sich
    if (adminFilter === 'ausstehend') return req.status === 'ausstehend';
    if (adminFilter === 'historie') return req.status !== 'ausstehend';
    return true; // 'alle'
  })

  if (loading) return <div className="p-10 text-center text-zinc-500 font-bold">Lade Anträge...</div>

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl">
              <CalendarClock size={28} />
            </div>
            {role === 'Admin' ? 'Team-Anträge verwalten' : 'Meine Anträge'}
          </h1>
          <p className="text-zinc-500 font-medium mt-2">
            {role === 'Admin' ? 'Hier verwaltest du die Urlaubs- und Abwesenheitsanträge deines Teams.' : 'Urlaub, Schichttausch und Abwesenheiten verwalten.'}
          </p>
        </div>
        
        {role === 'Mitarbeiter' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-3 rounded-xl font-bold shadow-md transition flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus size={18} strokeWidth={3} /> Neuer Antrag
          </button>
        )}
      </div>

      {role === 'Mitarbeiter' && (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-200 flex flex-col sm:flex-row items-center gap-6 mb-8 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 text-emerald-50 opacity-50 pointer-events-none">
            <Palmtree size={200} />
          </div>
          <div className="flex-1 space-y-1 relative z-10">
            <h3 className="text-lg font-extrabold text-zinc-900">Dein Urlaubsanspruch {new Date().getFullYear()}</h3>
            <p className="text-zinc-500 font-medium text-sm">Beinhaltet genehmigte Anträge.</p>
          </div>
          <div className="flex gap-4 relative z-10 w-full sm:w-auto">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex-1 text-center min-w-[120px]">
              <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Verfügbar</p>
              <p className="text-3xl font-black text-emerald-900">{leaveBalance.total - leaveBalance.used}</p>
            </div>
            <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl flex-1 text-center min-w-[120px]">
              <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Verbraucht</p>
              <p className="text-3xl font-black text-zinc-800">{leaveBalance.used}</p>
            </div>
          </div>
        </div>
      )}

      {/* NEU: Filter-Tabs für den Admin */}
      {role === 'Admin' && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
          <button 
            onClick={() => setAdminFilter('ausstehend')} 
            className={cn("px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap", adminFilter === 'ausstehend' ? "bg-teal-600 text-white shadow-md" : "bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50")}
          >
            Zu bearbeiten
          </button>
          <button 
            onClick={() => setAdminFilter('historie')} 
            className={cn("px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap", adminFilter === 'historie' ? "bg-teal-600 text-white shadow-md" : "bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50")}
          >
            Historie (Erledigt)
          </button>
          <button 
            onClick={() => setAdminFilter('alle')} 
            className={cn("px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap", adminFilter === 'alle' ? "bg-teal-600 text-white shadow-md" : "bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50")}
          >
            Alle anzeigen
          </button>
        </div>
      )}

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-zinc-200 border-dashed">
            <CalendarDays className="mx-auto text-zinc-300 mb-4" size={48} />
            <p className="text-zinc-500 font-bold text-lg">
              {adminFilter === 'ausstehend' ? 'Super! Alles abgearbeitet.' : 'Keine Anträge gefunden.'}
            </p>
          </div>
        ) : (
          filteredRequests.map(req => {
            const config = TYPE_CONFIG[req.type] || TYPE_CONFIG['Urlaub']
            const Icon = config.icon
            const days = calculateDays(req.start_date, req.end_date)
            
            return (
              <div key={req.id} className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-200 flex flex-col md:flex-row gap-5 items-start md:items-center transition hover:shadow-md">
                
                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shrink-0", config.bg, config.color)}>
                  <Icon size={28} />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-zinc-900">{req.type}</h3>
                    {role === 'Admin' && (
                      <span className="text-xs font-bold bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md">
                        von {req.profiles?.full_name || 'Mitarbeiter'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-zinc-600 flex items-center gap-2">
                    <CalendarDays size={14} className="text-zinc-400"/>
                    {new Date(req.start_date).toLocaleDateString('de-DE')} bis {new Date(req.end_date).toLocaleDateString('de-DE')} 
                    {req.type === 'Urlaub' && <span className="font-bold text-zinc-400">({days} Tage)</span>}
                  </p>
                  {req.user_comment && (
                    <p className="text-sm text-zinc-500 mt-2 bg-zinc-50 p-2 rounded-lg border border-zinc-100 line-clamp-2">
                      <span className="font-bold">Notiz:</span> {req.user_comment}
                    </p>
                  )}
                </div>

                <div className="shrink-0 w-full md:w-auto flex flex-row md:flex-col gap-2">
                  {/* NEU: Der Admin sieht die Knöpfe NUR, wenn der Status "ausstehend" ist. Ansonsten sieht er das Badge. */}
                  {role === 'Admin' && req.status === 'ausstehend' ? (
                    <>
                      <button onClick={() => handleAction(req.id, 'genehmigt', req.user_id, req.type, req.start_date, req.end_date)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2">
                        <CheckCircle2 size={18} /> Genehmigen
                      </button>
                      <button onClick={() => handleAction(req.id, 'abgelehnt', req.user_id, req.type, req.start_date, req.end_date)} className="flex-1 bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2">
                        <XCircle size={18} /> Ablehnen
                      </button>
                    </>
                  ) : (
                    <div className={cn(
                      "px-4 py-2.5 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 w-full md:w-auto",
                      req.status === 'ausstehend' ? "bg-amber-50 text-amber-700 border-amber-200" :
                      req.status === 'genehmigt' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      "bg-rose-50 text-rose-700 border-rose-200"
                    )}>
                      {req.status === 'ausstehend' && <Clock size={16} />}
                      {req.status === 'genehmigt' && <CheckCircle2 size={16} />}
                      {req.status === 'abgelehnt' && <XCircle size={16} />}
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg border border-zinc-200 overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-xl font-extrabold text-zinc-900 flex items-center gap-2">
                <Plus className="text-teal-600" size={24}/> Antrag einreichen
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-400 hover:bg-zinc-200 rounded-full transition"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Art des Antrags</label>
                <select 
                  className="w-full border-2 border-zinc-100 p-3.5 rounded-xl outline-none focus:border-teal-500 font-bold text-zinc-800 bg-white"
                  value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="Urlaub">🌴 Urlaubsantrag</option>
                  <option value="Schichtwechsel">🔄 Schichtwechsel</option>
                  <option value="Fortbildung">🎓 Fortbildung</option>
                  <option value="Krankmeldung">🩺 Krankmeldung / Arztbesuch</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Von</label>
                  <input type="date" required className="w-full border-2 border-zinc-100 p-3.5 rounded-xl outline-none focus:border-teal-500 font-medium text-zinc-800 bg-white" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Bis (inklusive)</label>
                  <input type="date" required className="w-full border-2 border-zinc-100 p-3.5 rounded-xl outline-none focus:border-teal-500 font-medium text-zinc-800 bg-white" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Kommentar / Grund (Optional)</label>
                <textarea rows={3} placeholder={formData.type === 'Schichtwechsel' ? "z.B. Tausche Frühschicht mit Sarah..." : "Notizen für die Verwaltung..."} className="w-full border-2 border-zinc-100 p-4 rounded-xl outline-none focus:border-teal-500 font-medium text-zinc-800 bg-white resize-none" value={formData.user_comment} onChange={e => setFormData({...formData, user_comment: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-600/20 transition-transform active:scale-95">
                Antrag verbindlich einreichen
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}