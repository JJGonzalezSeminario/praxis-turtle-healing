'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  AlertCircle, Users, FileText, Send, Trash2, Clock, MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  
  // Widget Daten
  const [orderCount, setOrderCount] = useState(0)
  const [workingToday, setWorkingToday] = useState<any[]>([])
  const [news, setNews] = useState<any[]>([])
  
  // Pinnwand Eingabe
  const [newMessage, setNewMessage] = useState('')

  const today = new Date()
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  const formattedDate = today.toLocaleDateString('de-DE', dateOptions)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    
    // Aktuellen Nutzer laden
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('*, roles(name)').eq('id', user.id).single()
      setUserProfile(profile)
    }

    // Materialbestellungen zählen
    const { count: openOrders } = await supabase.from('inventory').select('*', { count: 'exact', head: true }).eq('status', 'offen')
    setOrderCount(openOrders || 0)

    // Schichten heute
    const todayStr = today.toISOString().split('T')[0]
    const { data: shiftsToday } = await supabase.from('shifts').select('*, profiles(full_name)').eq('shift_date', todayStr)
    setWorkingToday(shiftsToday || [])

    fetchNews()
    setLoading(false)
  }

  const fetchNews = async () => {
    const { data } = await supabase.from('news_board').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(20)
    setNews(data || [])
  }

  const postNews = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !userProfile) return

    const { error } = await supabase.from('news_board').insert([{
      user_id: userProfile.id,
      message: newMessage.trim()
    }])

    if (!error) {
      setNewMessage('')
      fetchNews()
    }
  }

  const deleteNews = async (id: string) => {
    await supabase.from('news_board').delete().eq('id', id)
    fetchNews()
  }

  if (loading) return <div className="p-10 text-center font-bold text-zinc-400">Lade Dashboard...</div>

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500 font-sans space-y-8">
      
      {/* 1. PREMIUM BEGRÜßUNGS-BANNER */}
      <div className="bg-gradient-to-br from-teal-950 via-teal-900 to-emerald-900 rounded-[2rem] p-10 sm:p-14 text-white shadow-2xl shadow-teal-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <p className="text-teal-200/80 font-semibold uppercase tracking-widest text-xs mb-3">{formattedDate}</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white">
            Guten Morgen, {userProfile?.full_name?.split(' ')[0] || 'Team'}.
          </h1>
        </div>
      </div>

      {/* 2. WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Widget 1: Material */}
        <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-start mb-6">
            <div className={cn("p-4 rounded-2xl", orderCount > 0 ? "bg-rose-50 text-rose-500" : "bg-zinc-50 text-zinc-400")}>
              <AlertCircle size={28} strokeWidth={2.5} />
            </div>
            <span className="text-5xl font-black text-zinc-900 tracking-tighter">{orderCount}</span>
          </div>
          <div>
            <h3 className="font-extrabold text-zinc-900 text-lg">Einkaufsliste</h3>
            <p className={cn("text-sm font-medium mt-1", orderCount > 0 ? "text-rose-500" : "text-zinc-400")}>
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
                ? workingToday.map(s => s.profiles?.full_name?.split(' ')[0]).join(', ')
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
            <span className="text-5xl font-black text-zinc-200 tracking-tighter">-</span>
          </div>
          <div>
            <h3 className="font-extrabold text-zinc-900 text-lg">Neuaufnahmen</h3>
            <p className="text-sm font-medium text-zinc-400 mt-1">
              Erfasste Formulare (Heute)
            </p>
          </div>
        </div>
      </div>

      {/* 3. MODERNE PINNWAND */}
      <div className="bg-white border border-zinc-100 rounded-[2rem] overflow-hidden shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
        <div className="p-8 border-b border-zinc-100 flex items-center gap-3">
          <div className="p-2.5 bg-zinc-100 text-zinc-600 rounded-xl">
            <MessageSquare size={20} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight">
            Interne Mitteilungen
          </h2>
        </div>
        
        <div className="p-8 bg-zinc-50/30">
          <form onSubmit={postNews} className="flex flex-col sm:flex-row gap-4 mb-10">
            <input 
              type="text" 
              placeholder="Nachricht an das Team verfassen..." 
              className="flex-1 bg-white border border-zinc-200 p-4 rounded-2xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium text-zinc-800"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
            />
            <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-teal-600/20 transition-all active:scale-95 flex items-center justify-center gap-2">
              <Send size={18} strokeWidth={2.5} /> Senden
            </button>
          </form>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {news.length === 0 ? (
              <div className="col-span-full p-12 text-center text-zinc-400 font-semibold text-sm border-2 border-dashed border-zinc-100 rounded-3xl">
                Keine neuen Mitteilungen.
              </div>
            ) : (
              news.map(item => {
                const isOwnerOrAdmin = userProfile?.id === item.user_id || userProfile?.roles?.name === 'Super Admin' || userProfile?.roles?.name === 'IT-Admin'
                return (
                  <div key={item.id} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm group relative hover:shadow-md transition-all">
                    <p className="font-medium text-zinc-800 mb-6 pr-6 leading-relaxed">{item.message}</p>
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      <span>{item.profiles?.full_name}</span>
                      <span className="flex items-center gap-1.5"><Clock size={12} strokeWidth={2.5}/> {new Date(item.created_at).toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    
                    {isOwnerOrAdmin && (
                      <button onClick={() => deleteNews(item.id)} className="absolute top-4 right-4 p-2 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={16} strokeWidth={2.5} />
                      </button>
                    )}
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