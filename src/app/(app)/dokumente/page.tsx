'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  FileText, Upload, Trash2, Search, Download, 
  FileCheck, ShieldAlert, FileDigit, Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { id: 'all', label: 'Alle Dokumente', icon: FileText },
  { id: 'Leitfaden', label: 'Leitfäden & QM', icon: ShieldAlert },
  { id: 'Hygieneplan', label: 'Hygienepläne', icon: FileCheck },
  { id: 'Vorlage', label: 'Vorlagen', icon: FileDigit },
  { id: 'Formular', label: 'Formulare', icon: Settings },
]

export default function DokumentencenterPage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  const [documents, setDocuments] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Neues Dokument Formular (Modal)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newDoc, setNewDoc] = useState({ title: '', category: 'Leitfaden' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: profile } = await supabase.from('profiles').select('*, roles(name)').eq('id', user.id).single()
    setIsAdmin(profile?.roles?.name === 'Super Admin' || profile?.roles?.name === 'IT-Admin' || profile?.roles?.name === 'Arzt / Ärztin')

    const { data: docs } = await supabase
      .from('documents')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
    
    setDocuments(docs || [])
    setLoading(false)
  }

  // Hilfsfunktion: Dateigröße schön formatieren (z.B. "2.4 MB")
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
  }

  // DER UPLOAD-PROZESS
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !newDoc.title || !userId) {
      alert("Bitte fülle alle Felder aus und wähle eine PDF-Datei.")
      return
    }

    if (selectedFile.type !== 'application/pdf') {
      alert("Bitte nur PDF-Dateien hochladen!")
      return
    }

    setIsUploading(true)
    setUploadProgress(10) // Simulierter Start

    try {
      // 1. Eindeutigen Dateinamen generieren (damit nichts überschrieben wird)
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `${newDoc.category}/${fileName}` // Ordnet sie in Ordnern im Storage

      setUploadProgress(40)

      // 2. Datei in den Storage-Bucket hochladen
      const { error: uploadError } = await supabase.storage
        .from('praxis_documents')
        .upload(filePath, selectedFile, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError
      setUploadProgress(80)

      // 3. Datenbank-Eintrag erstellen (Verknüpfung)
      const { data: publicUrlData } = supabase.storage.from('praxis_documents').getPublicUrl(filePath)
      
      const { error: dbError } = await supabase.from('documents').insert([{
        title: newDoc.title,
        category: newDoc.category,
        file_url: publicUrlData.publicUrl,
        file_size: selectedFile.size,
        uploaded_by: userId
      }])

      if (dbError) throw dbError
      setUploadProgress(100)

      // Aufräumen & Aktualisieren
      setIsModalOpen(false)
      setSelectedFile(null)
      setNewDoc({ title: '', category: 'Leitfaden' })
      fetchData()

    } catch (error: any) {
      alert("Fehler beim Hochladen: " + error.message)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // DOKUMENT LÖSCHEN (Nur Admin)
  const handleDelete = async (doc: any) => {
    if (!confirm(`Möchtest du "${doc.title}" wirklich endgültig löschen?`)) return

    try {
      // 1. Aus dem Storage löschen (Den Pfad aus der URL extrahieren)
      const pathParts = doc.file_url.split('/praxis_documents/')
      if (pathParts.length > 1) {
        const filePath = pathParts[1]
        await supabase.storage.from('praxis_documents').remove([filePath])
      }

      // 2. Aus der Datenbank löschen
      await supabase.from('documents').delete().eq('id', doc.id)
      
      // Liste aktualisieren
      setDocuments(documents.filter(d => d.id !== doc.id))
    } catch (error) {
      alert("Fehler beim Löschen.")
    }
  }

  const filteredDocs = documents.filter(doc => {
    const matchesCategory = activeCategory === 'all' || doc.category === activeCategory
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (loading) return <div className="p-10 text-center text-zinc-500 font-bold">Lade Dokumente...</div>

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl">
              <FileText size={28} />
            </div>
            Dokumentencenter
          </h1>
          <p className="text-zinc-500 font-medium mt-2">
            Zentrale Ablage für Formulare, Hygienepläne und Praxis-Vorlagen.
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-3 rounded-xl font-bold shadow-md transition flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Upload size={18} strokeWidth={3} /> PDF hochladen
        </button>
      </div>

      <div className="space-y-4 mb-8">
        <div className="relative group max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-400 group-focus-within:text-teal-600 transition-colors" />
          </div>
          <input 
            type="text"
            placeholder="Nach Dokumenten suchen..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-zinc-200 rounded-2xl outline-none focus:border-teal-500 transition-all font-medium text-zinc-800 shadow-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-2",
                  activeCategory === cat.id 
                    ? "bg-teal-600 text-white shadow-md" 
                    : "bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50"
                )}
              >
                <Icon size={16} /> {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* DOKUMENTEN-LISTE */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="mx-auto text-zinc-300 mb-4" size={48} />
            <p className="text-zinc-500 font-bold text-lg">Keine PDFs in dieser Kategorie gefunden.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredDocs.map(doc => (
              <div key={doc.id} className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:bg-zinc-50 transition-colors group">
                
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={24} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-extrabold text-zinc-900 truncate">{doc.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-zinc-500 mt-1 font-medium">
                    <span className="bg-zinc-100 px-2 py-0.5 rounded-md text-xs font-bold text-zinc-600 uppercase tracking-wider">
                      {doc.category}
                    </span>
                    <span>•</span>
                    <span>{formatBytes(doc.file_size)}</span>
                    <span>•</span>
                    <span>Von {doc.profiles?.full_name || 'System'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a 
                    href={doc.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none bg-teal-50 hover:bg-teal-100 text-teal-700 px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2"
                  >
                    <Download size={18} /> Öffnen
                  </a>
                  
                  {isAdmin && (
                    <button 
                      onClick={() => handleDelete(doc)}
                      className="p-2.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                      title="Löschen"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: UPLOAD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={() => !isUploading && setIsModalOpen(false)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg border border-zinc-200 overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-zinc-100">
              <h2 className="text-xl font-extrabold text-zinc-900 flex items-center gap-2">
                <Upload className="text-teal-600" size={24}/> Neues PDF hochladen
              </h2>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Titel des Dokuments</label>
                <input type="text" required placeholder="z.B. Hygieneplan 2026" className="w-full border-2 border-zinc-100 p-3.5 rounded-xl outline-none focus:border-teal-500 font-medium text-zinc-800 bg-white" value={newDoc.title} onChange={e => setNewDoc({...newDoc, title: e.target.value})} disabled={isUploading} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Kategorie</label>
                <select className="w-full border-2 border-zinc-100 p-3.5 rounded-xl outline-none focus:border-teal-500 font-bold text-zinc-800 bg-white" value={newDoc.category} onChange={e => setNewDoc({...newDoc, category: e.target.value})} disabled={isUploading}>
                  {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">PDF-Datei auswählen</label>
                <input 
                  type="file" 
                  accept=".pdf" 
                  required
                  ref={fileInputRef}
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full border-2 border-zinc-100 p-3 rounded-xl text-sm font-medium text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                  disabled={isUploading}
                />
              </div>

              <button 
                type="submit" 
                disabled={isUploading}
                className={cn("w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all pt-2 flex justify-center items-center gap-2", isUploading ? "bg-zinc-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700 active:scale-95 shadow-teal-600/20")}
              >
                {isUploading ? `Lädt hoch... (${uploadProgress}%)` : 'Dokument speichern'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}