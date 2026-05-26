'use client'

import { useState } from 'react'
import { Search, BookOpen, Plus, Edit, Trash2, X, Save, AlertCircle, AlertTriangle, Shield, FileText, Folder } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// NEU: Visuelles Design für die verschiedenen Kategorien
const CATEGORY_STYLES: Record<string, { color: string, bg: string, border: string, icon: any }> = {
  'Wichtig': { color: 'text-rose-700', bg: 'bg-rose-100/50', border: 'border-rose-500', icon: AlertTriangle },
  'QM': { color: 'text-emerald-700', bg: 'bg-emerald-100/50', border: 'border-emerald-500', icon: Shield },
  'Admin': { color: 'text-blue-700', bg: 'bg-blue-100/50', border: 'border-blue-500', icon: FileText },
  'default': { color: 'text-indigo-700', bg: 'bg-indigo-100/50', border: 'border-indigo-500', icon: Folder }
}

export function WikiView({ categories, entries: initialEntries }: { categories: any[], entries: any[] }) {
  const supabase = createClient()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [entries, setEntries] = useState(initialEntries)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    id: '',
    category_id: categories[0]?.id || '',
    title: '',
    content: ''
  })

  const filteredEntries = entries.filter(entry => 
    entry.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (entry.content && entry.content.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const openNewEntryModal = () => {
    setFormData({ id: '', category_id: categories[0]?.id || '', title: '', content: '' })
    setIsEditing(false)
    setIsModalOpen(true)
  }

  const openEditModal = (entry: any) => {
    setFormData({ id: entry.id, category_id: entry.category_id, title: entry.title, content: entry.content })
    setIsEditing(true)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchtest du diesen Eintrag wirklich endgültig löschen?')) return
    setEntries(entries.filter(e => e.id !== id))
    const { error } = await supabase.from('wiki_entries').delete().eq('id', id)
    if (error) {
      alert('Fehler beim Löschen: ' + error.message)
      window.location.reload()
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.content) return
    setLoading(true)

    if (isEditing) {
      const { error } = await supabase.from('wiki_entries')
        .update({ title: formData.title, category_id: formData.category_id, content: formData.content })
        .eq('id', formData.id)
      if (!error) setEntries(entries.map(entry => entry.id === formData.id ? { ...entry, ...formData } : entry))
      else alert('Fehler beim Speichern: ' + error.message)
    } else {
      const { data, error } = await supabase.from('wiki_entries')
        .insert([{ title: formData.title, category_id: formData.category_id, content: formData.content }])
        .select().single()
      if (!error && data) setEntries([...entries, data])
      else if (error) alert('Fehler beim Erstellen: ' + error.message)
    }

    setLoading(false)
    setIsModalOpen(false)
  }

  return (
    <div className="animate-in fade-in duration-500 relative">
      
      {/* HEADER: Aufgeräumter und moderner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
              <BookOpen size={28} />
            </div>
            Praxis-Wissen
          </h1>
          <p className="text-zinc-500 font-medium mt-2">Zentrale Abläufe, Notfallnummern und Richtlinien.</p>
        </div>
        <button 
          onClick={openNewEntryModal}
          className="bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={18} strokeWidth={3} /> Eintrag verfassen
        </button>
      </div>

      {/* SUCHLEISTE: Schwebender Effekt */}
      <div className="relative mb-10 group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="text-zinc-400 group-focus-within:text-indigo-600 transition-colors" size={22} />
        </div>
        <input 
          type="text"
          placeholder="Suchen nach 'Labor', 'Notfall'..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl border-0 ring-1 ring-zinc-200 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-lg placeholder:text-zinc-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* KACHEL-RASTER: Neues Design */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-zinc-200 border-dashed">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-zinc-400" size={28} />
          </div>
          <p className="text-zinc-500 font-medium text-lg">Keine Einträge für diese Suche gefunden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEntries.map((entry) => {
            const categoryName = categories.find(c => c.id === entry.category_id)?.name || 'Allgemein'
            const style = CATEGORY_STYLES[categoryName] || CATEGORY_STYLES['default']
            const Icon = style.icon

            return (
              <div 
                key={entry.id} 
                className={cn(
                  "bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-zinc-100 border-l-4 group flex flex-col justify-between relative overflow-hidden",
                  style.border
                )}
              >
                {/* Deko-Hintergrund für die Kategorie */}
                <div className={cn("absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 pointer-events-none transition-transform group-hover:scale-150", style.bg)} />

                <div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider", style.bg, style.color)}>
                      <Icon size={14} strokeWidth={2.5} /> {categoryName}
                    </div>
                    
                    <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-lg">
                      <button onClick={() => openEditModal(entry)} className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition" title="Bearbeiten">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(entry.id)} className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition" title="Löschen">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-extrabold text-zinc-900 mb-3 relative z-10">{entry.title}</h3>
                  <div className="text-zinc-600 font-medium leading-relaxed whitespace-pre-wrap text-sm relative z-10">
                    {entry.content}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL FÜR FORMULAR (Bleibt unverändert schick) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 bg-white">
              <h2 className="text-xl font-extrabold text-zinc-900 flex items-center gap-3">
                {isEditing ? <Edit className="text-indigo-600" size={20}/> : <Plus className="text-indigo-600" size={20}/>}
                {isEditing ? 'Eintrag bearbeiten' : 'Neues Wissen hinzufügen'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 flex flex-col gap-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Titel</label>
                  <input type="text" required className="w-full border-0 ring-1 ring-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Kategorie</label>
                  <select required className="w-full border-0 ring-1 ring-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium bg-white" value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2 flex-1 flex flex-col">
                <label className="text-sm font-bold text-zinc-700">Inhalt / Anleitung</label>
                <textarea required rows={8} className="w-full border-0 ring-1 ring-zinc-200 p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium resize-none flex-1 leading-relaxed" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition">Abbrechen</button>
                <button type="submit" disabled={loading} className="flex-1 py-3.5 font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-md transition flex items-center justify-center gap-2">{loading ? 'Speichert...' : 'Speichern'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}