'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Trash2, Clock, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NewsItem {
  id: string
  message: string
  user_id: string
  created_at: string
  profiles: { full_name: string } | null
}

interface NewsBoardClientProps {
  initialNews: NewsItem[]
  currentUserId: string
  isAdmin: boolean
}

/**
 * NewsBoardClient: Interaktiver Teil des Dashboards (Pinnwand).
 * Nur dieser Teil muss ein Client Component sein, da er Nutzer-Interaktionen
 * (Tippen, Absenden, Löschen) handhabt.
 *
 * Fix #9: Vollständiges Error-Handling für postNews und deleteNews.
 */
export function NewsBoardClient({ initialNews, currentUserId, isAdmin }: NewsBoardClientProps) {
  const supabase = createClient()
  const [news, setNews] = useState<NewsItem[]>(initialNews)
  const [newMessage, setNewMessage] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)

  const fetchNews = async () => {
    const { data } = await supabase
      .from('news_board')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(20)
    setNews((data as NewsItem[]) || [])
  }

  const postNews = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsPosting(true)
    setPostError(null)

    // Fix #9: Fehler beim Posten werden dem Nutzer angezeigt
    const { error } = await supabase.from('news_board').insert([{
      user_id: currentUserId,
      message: newMessage.trim()
    }])

    if (error) {
      setPostError('Nachricht konnte nicht gesendet werden. Bitte erneut versuchen.')
      console.error('Fehler beim Posten:', error)
    } else {
      setNewMessage('')
      await fetchNews()
    }
    setIsPosting(false)
  }

  const deleteNews = async (id: string) => {
    // Fix #9: Bestätigungsdialog + Error-Handling
    if (!confirm('Diese Mitteilung wirklich löschen?')) return

    const { error } = await supabase.from('news_board').delete().eq('id', id)

    if (error) {
      alert('Mitteilung konnte nicht gelöscht werden.')
      console.error('Fehler beim Löschen:', error)
    } else {
      await fetchNews()
    }
  }

  return (
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
            disabled={isPosting}
          />
          <button
            type="submit"
            disabled={isPosting || !newMessage.trim()}
            className="bg-teal-600 hover:bg-teal-700 disabled:bg-zinc-400 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-teal-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Send size={18} strokeWidth={2.5} />
            {isPosting ? 'Sendet...' : 'Senden'}
          </button>
        </form>

        {/* Fix #9: Fehlermeldung beim Posten */}
        {postError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-medium">
            {postError}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {news.length === 0 ? (
            <div className="col-span-full p-12 text-center text-zinc-400 font-semibold text-sm border-2 border-dashed border-zinc-100 rounded-3xl">
              Keine neuen Mitteilungen.
            </div>
          ) : (
            news.map(item => {
              const isOwnerOrAdmin = currentUserId === item.user_id || isAdmin
              return (
                <div key={item.id} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm group relative hover:shadow-md transition-all">
                  <p className="font-medium text-zinc-800 mb-6 pr-6 leading-relaxed">{item.message}</p>
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    <span>{item.profiles?.full_name}</span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} strokeWidth={2.5} />
                      {new Date(item.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {isOwnerOrAdmin && (
                    <button
                      onClick={() => deleteNews(item.id)}
                      className="absolute top-4 right-4 p-2 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      title="Mitteilung löschen"
                    >
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
  )
}
