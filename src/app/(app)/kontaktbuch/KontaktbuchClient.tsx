'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  NotebookTabs, Search, Plus, Phone, Mail, MapPin, 
  FileText, Trash2, X, FlaskConical, User, Pill, Building, Wrench, HelpCircle, Pencil
} from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { id: 'all', label: 'Alle Kontakte' },
  { id: 'Labor', label: 'Labore' },
  { id: 'Arzt / Kollege', label: 'Ärzte & Kollegen' },
  { id: 'Apotheke', label: 'Apotheken' },
  { id: 'Klinik', label: 'Kliniken' },
  { id: 'Technik', label: 'Technik & Support' },
  { id: 'Sonstiges', label: 'Sonstiges' }
]

const CAT_ICONS: Record<string, any> = {
  'Labor': FlaskConical,
  'Arzt / Kollege': User,
  'Apotheke': Pill,
  'Klinik': Building,
  'Technik': Wrench,
  'Sonstiges': HelpCircle
}

const EMPTY_FORM = { name: '', category: 'Labor', phone: '', email: '', address: '', notes: '' }

interface Props {
  initialContacts: any[]
  isAdmin: boolean
}

export function KontaktbuchClient({ initialContacts, isAdmin }: Props) {
  const supabase = createClient()

  const [contacts, setContacts] = useState<any[]>(initialContacts)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  
  // Modal-State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)

  const openNewModal = () => {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setIsModalOpen(true)
  }

  const openEditModal = (contact: any) => {
    setEditingId(contact.id)
    setFormData({
      name: contact.name || '',
      category: contact.category || 'Labor',
      phone: contact.phone || '',
      email: contact.email || '',
      address: contact.address || '',
      notes: contact.notes || '',
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData(EMPTY_FORM)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return

    if (editingId) {
      // UPDATE bestehenden Kontakt
      const { data, error } = await supabase
        .from('contacts')
        .update(formData)
        .eq('id', editingId)
        .select()
        .single()

      if (!error && data) {
        setContacts(
          contacts
            .map(c => c.id === editingId ? data : c)
            .sort((a, b) => a.name.localeCompare(b.name))
        )
        closeModal()
      } else {
        alert('Fehler beim Aktualisieren des Kontakts.')
        console.error('Update-Fehler:', error)
      }
    } else {
      // INSERT neuen Kontakt
      const { data, error } = await supabase.from('contacts').insert([formData]).select()
      if (!error && data) {
        setContacts([...contacts, data[0]].sort((a, b) => a.name.localeCompare(b.name)))
        closeModal()
      } else {
        alert('Ein Fehler ist aufgetreten. Bitte versuche es erneut.')
        console.error('Kontakt-Fehler:', error)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Möchtest du diesen Kontakt wirklich aus dem Telefonbuch löschen?')) return
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (!error) {
      setContacts(contacts.filter(c => c.id !== id))
    }
  }

  // Filter-Logik (Kategorie + Suchbegriff)
  const filteredContacts = contacts.filter(c => {
    const matchesCategory = activeCategory === 'all' || c.category === activeCategory
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (c.phone && c.phone.includes(searchQuery))
    return matchesCategory && matchesSearch
  })

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl">
              <NotebookTabs size={28} />
            </div>
            Praxis-Kontaktbuch
          </h1>
          <p className="text-zinc-500 font-medium mt-2">
            Das digitale Telefonbuch für den Tresen. Schneller Zugriff auf alle wichtigen Kontakte.
          </p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={openNewModal}
            className="bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-3 rounded-xl font-bold shadow-md transition flex items-center gap-2 w-full sm:w-auto justify-center"
            aria-label="Neuen Kontakt hinzufügen"
          >
            <Plus size={18} strokeWidth={3} aria-hidden="true" /> Kontakt hinzufügen
          </button>
        )}
      </div>

      {/* FILTER & SUCHE */}
      <div className="space-y-4 mb-8">
        <div className="relative group max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-400 group-focus-within:text-teal-600 transition-colors" aria-hidden="true" />
          </div>
          <input 
            type="text"
            placeholder="Name, Telefonnummer oder Notiz suchen..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-zinc-200 rounded-2xl outline-none focus:border-teal-500 transition-all font-medium text-zinc-800 shadow-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Kontakte durchsuchen"
          />
        </div>

        {/* Kategorien-Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar" role="tablist" aria-label="Kategorien filtern">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              role="tab"
              aria-selected={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap",
                activeCategory === cat.id 
                  ? "bg-teal-600 text-white shadow-md" 
                  : "bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* KONTAKT-GRID */}
      {filteredContacts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-zinc-200 border-dashed">
          <NotebookTabs className="mx-auto text-zinc-300 mb-4" size={48} aria-hidden="true" />
          <p className="text-zinc-500 font-bold text-lg">Keine passenden Kontakte im Telefonbuch gefunden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContacts.map(contact => {
            const Icon = CAT_ICONS[contact.category] || HelpCircle
            return (
              <div key={contact.id} className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group">
                
                {/* Admin Aktions-Buttons: Bearbeiten + Löschen */}
                {isAdmin && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditModal(contact)}
                      className="p-2 text-zinc-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors"
                      aria-label={`Kontakt "${contact.name}" bearbeiten`}
                      title="Kontakt bearbeiten"
                    >
                      <Pencil size={15} aria-hidden="true" />
                    </button>
                    <button 
                      onClick={() => handleDelete(contact.id)}
                      className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      aria-label={`Kontakt "${contact.name}" löschen`}
                      title="Kontakt löschen"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Name & Badge */}
                  <div>
                    <span className="text-[10px] font-extrabold uppercase bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-md mb-2 inline-flex items-center gap-1.5">
                      <Icon size={12} aria-hidden="true" /> {contact.category}
                    </span>
                    <h3 className="text-lg font-black text-zinc-900 tracking-tight mt-1 truncate">{contact.name}</h3>
                  </div>

                  {/* Kommunikationsdaten */}
                  <div className="space-y-2.5 text-sm font-medium text-zinc-600">
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="flex items-center gap-3 hover:text-teal-600 transition-colors" aria-label={`${contact.name} anrufen: ${contact.phone}`}>
                        <Phone size={16} className="text-zinc-400 shrink-0" aria-hidden="true" /> {contact.phone}
                      </a>
                    )}
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="flex items-center gap-3 hover:text-teal-600 transition-colors" aria-label={`E-Mail an ${contact.name}: ${contact.email}`}>
                        <Mail className="text-zinc-400 shrink-0" size={16} aria-hidden="true" /> <span className="truncate">{contact.email}</span>
                      </a>
                    )}
                    {contact.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="text-zinc-400 shrink-0 mt-0.5" size={16} aria-hidden="true" />
                        <span className="text-zinc-500 leading-snug">{contact.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notizbox */}
                {contact.notes && (
                  <div className="mt-5 bg-amber-50/70 border border-amber-100 rounded-xl p-3 text-xs font-medium text-amber-800 flex items-start gap-2">
                    <FileText size={14} className="text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="leading-relaxed">{contact.notes}</p>
                  </div>
                )}

              </div>
            )
          })}
        </div>
      )}

      {/* MODAL: NEUER / BEARBEITETER KONTAKT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={closeModal}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg border border-zinc-200 overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-xl font-extrabold text-zinc-900 flex items-center gap-2">
                {editingId
                  ? <><Pencil className="text-teal-600" size={22} aria-hidden="true" /> Kontakt bearbeiten</>
                  : <><Plus className="text-teal-600" size={24} aria-hidden="true" /> Neuen Kontakt anlegen</>
                }
              </h2>
              <button onClick={closeModal} className="p-2 text-zinc-400 hover:bg-zinc-200 rounded-full transition" aria-label="Modal schließen">
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase" htmlFor="contact-name">Name / Unternehmen *</label>
                <input id="contact-name" type="text" required placeholder="z.B. Zentrallabor Berlin" className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-teal-500 font-medium text-zinc-800 bg-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase" htmlFor="contact-category">Kategorie</label>
                <select 
                  id="contact-category"
                  className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-teal-500 font-bold text-zinc-800 bg-white"
                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="Labor">Labor</option>
                  <option value="Arzt / Kollege">Arzt / Kollege</option>
                  <option value="Apotheke">Apotheke</option>
                  <option value="Klinik">Klinik</option>
                  <option value="Technik">Technik & Support</option>
                  <option value="Sonstiges">Sonstiges</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase" htmlFor="contact-phone">Telefonnummer</label>
                  <input id="contact-phone" type="tel" placeholder="030..." className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-teal-500 font-medium text-zinc-800 bg-white" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase" htmlFor="contact-email">E-Mail-Adresse</label>
                  <input id="contact-email" type="email" placeholder="info@..." className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-teal-500 font-medium text-zinc-800 bg-white" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase" htmlFor="contact-address">Anschrift / Adresse</label>
                <input id="contact-address" type="text" placeholder="Straße, PLZ, Ort" className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-teal-500 font-medium text-zinc-800 bg-white" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase" htmlFor="contact-notes">Wichtige Tresen-Notiz</label>
                <textarea id="contact-notes" rows={2} placeholder="Hier wichtige Infos für das Team eintragen..." className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-teal-500 font-medium text-zinc-800 bg-white resize-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>

              <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-600/20 transition-transform active:scale-95">
                {editingId ? 'Änderungen speichern' : 'Kontakt im Telefonbuch speichern'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
