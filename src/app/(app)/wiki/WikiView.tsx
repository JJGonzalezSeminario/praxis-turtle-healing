'use client'

import { useState } from 'react'
import { Search, BookOpen, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function WikiView({ categories, entries }: { categories: any[], entries: any[] }) {
  const [searchTerm, setSearchTerm] = useState('')

  // Filter-Logik: Durchsucht Titel und Inhalt
  const filteredEntries = entries.filter(entry => 
    entry.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    entry.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <BookOpen className="text-indigo-600" size={32} />
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Praxis-Wiki</h1>
      </div>

      {/* Suchleiste */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-4 text-zinc-400" size={20} />
        <input 
          type="text"
          placeholder="Wissen suchen (z.B. Labor, Notfall, Anmeldung)..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-zinc-200 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Ergebnis-Raster */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEntries.map((entry) => (
          <div key={entry.id} className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200 hover:shadow-md transition">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
              {categories.find(c => c.id === entry.category_id)?.name || 'Allgemein'}
            </span>
            <h3 className="text-xl font-extrabold text-zinc-900 mt-3 mb-2">{entry.title}</h3>
            <p className="text-zinc-600 font-medium leading-relaxed whitespace-pre-line">
              {entry.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}