'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createUser, updateUser, resetPassword } from '@/app/actions/admin-users'
import { 
  Users, UserPlus, Key, Edit, Shield, CheckCircle2, XCircle, Search, X 
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function NutzerverwaltungPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Modal States
  const [activeModal, setActiveModal] = useState<'create' | 'edit' | 'password' | null>(null)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Formular-State
  const [formData, setFormData] = useState({
    email: '', password: '', full_name: '', role_id: '', is_active: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    // Rollen laden
    const { data: rolesData } = await supabase.from('roles').select('*').order('name')
    setRoles(rolesData || [])

    // Profile laden
    const { data: profilesData } = await supabase.from('profiles').select('*, roles(name)').order('full_name')
    setProfiles(profilesData || [])
    
    setLoading(false)
  }

  // --- AKTIONEN ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const res = await createUser({
      email: formData.email,
      password: formData.password,
      full_name: formData.full_name,
      role_id: formData.role_id
    })
    setIsSubmitting(false)

    if (res.error) alert("Fehler: " + res.error)
    else {
      setActiveModal(null)
      fetchData()
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setIsSubmitting(true)
    const res = await updateUser(selectedUser.id, {
      email: formData.email,
      full_name: formData.full_name,
      role_id: formData.role_id,
      is_active: formData.is_active
    })
    setIsSubmitting(false)

    if (res.error) alert("Fehler: " + res.error)
    else {
      setActiveModal(null)
      fetchData()
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !formData.password) return
    setIsSubmitting(true)
    const res = await resetPassword(selectedUser.id, formData.password)
    setIsSubmitting(false)

    if (res.error) alert("Fehler: " + res.error)
    else {
      alert(`Das Passwort für ${selectedUser.full_name} wurde erfolgreich geändert!`)
      setActiveModal(null)
    }
  }

  // --- HILFSFUNKTIONEN ---
  const openEditModal = (user: any) => {
    setSelectedUser(user)
    setFormData({
      email: user.email || '', 
      password: '', 
      full_name: user.full_name || '', 
      role_id: user.role_id || '', 
      is_active: user.is_active ?? true
    })
    setActiveModal('edit')
  }

  const openPasswordModal = (user: any) => {
    setSelectedUser(user)
    setFormData({ ...formData, password: '' })
    setActiveModal('password')
  }

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.roles?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return <div className="p-10 text-center font-bold text-zinc-500">Lade Nutzerverwaltung...</div>

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
              <Users size={28} />
            </div>
            Nutzerverwaltung
          </h1>
          <p className="text-zinc-500 font-medium mt-2">
            Praxis-Team verwalten, Rollen zuweisen und Zugänge steuern.
          </p>
        </div>
        
        <button 
          onClick={() => {
            setFormData({ email: '', password: '', full_name: '', role_id: roles[0]?.id || '', is_active: true })
            setActiveModal('create')
          }}
          className="bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-3 rounded-xl font-bold shadow-md transition flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <UserPlus size={18} strokeWidth={3} /> Nutzer anlegen
        </button>
      </div>

      {/* SUCHE */}
      <div className="mb-6 max-w-md relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
        </div>
        <input 
          type="text"
          placeholder="Nach Name oder Rolle suchen..."
          className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-zinc-200 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium text-zinc-800 shadow-sm"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* TABELLE */}
      <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-100 text-xs uppercase tracking-wider text-zinc-500 font-bold">
              <th className="p-4 pl-6">Mitarbeiter</th>
              <th className="p-4">Rolle</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right pr-6">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredProfiles.map(user => {
              const isActive = user.is_active ?? true
              const isAdmin = user.roles?.name === 'Super Admin' || user.roles?.name === 'IT-Admin'
              
              return (
                <tr key={user.id} className={cn("hover:bg-zinc-50 transition-colors", !isActive && "opacity-60")}>
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm", isAdmin ? "bg-indigo-100 text-indigo-700" : "bg-zinc-100 text-zinc-700")}>
                        {user.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="font-extrabold text-zinc-900">{user.full_name}</div>
                        <div className="text-sm font-medium text-zinc-500">{user.email || 'Keine E-Mail verknüpft'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-200 flex items-center gap-1.5 w-max">
                      {isAdmin && <Shield size={12} className="text-indigo-600"/>}
                      {user.roles?.name || 'Keine Rolle'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={cn("px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5", isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200")}>
                      {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right space-x-2">
                    <button 
                      onClick={() => openPasswordModal(user)}
                      className="p-2 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition"
                      title="Startpasswort neu vergeben"
                    >
                      <Key size={18} />
                    </button>
                    <button 
                      onClick={() => openEditModal(user)}
                      className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                      title="Mitarbeiter bearbeiten"
                    >
                      <Edit size={18} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL: NEUER NUTZER / BEARBEITEN / PASSWORT */}
      {activeModal && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={() => !isSubmitting && setActiveModal(null)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md border border-zinc-200 overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-xl font-extrabold text-zinc-900 flex items-center gap-2">
                {activeModal === 'create' && <><UserPlus className="text-indigo-600" size={24}/> Neuen Mitarbeiter anlegen</>}
                {activeModal === 'edit' && <><Edit className="text-indigo-600" size={24}/> Mitarbeiter bearbeiten</>}
                {activeModal === 'password' && <><Key className="text-amber-500" size={24}/> Startpasswort vergeben</>}
              </h2>
              <button onClick={() => !isSubmitting && setActiveModal(null)} className="p-2 text-zinc-400 hover:bg-zinc-200 rounded-full transition"><X size={20}/></button>
            </div>

            <form onSubmit={
              activeModal === 'create' ? handleCreateUser : 
              activeModal === 'edit' ? handleUpdateUser : 
              handleResetPassword
            } className="p-6 space-y-4">
              
              {(activeModal === 'create' || activeModal === 'edit') && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Vor- und Nachname</label>
                    <input type="text" required className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-indigo-500 font-medium text-zinc-800" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} disabled={isSubmitting} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Login E-Mail</label>
                    <input type="email" required className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-indigo-500 font-medium text-zinc-800" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={isSubmitting} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Rolle / Berechtigungen</label>
                    <select required className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-indigo-500 font-bold text-zinc-800" value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})} disabled={isSubmitting}>
                      <option value="" disabled>Bitte wählen...</option>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              {(activeModal === 'create' || activeModal === 'password') && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Startpasswort (mind. 6 Zeichen)</label>
                  <input type="text" required minLength={6} placeholder="z.B. Turtle2026!" className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-indigo-500 font-medium text-zinc-800" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} disabled={isSubmitting} />
                  {activeModal === 'password' && <p className="text-xs text-zinc-500 mt-1">Der Nutzer kann sich ab sofort nur noch mit diesem neuen Passwort einloggen.</p>}
                </div>
              )}

              {activeModal === 'edit' && (
                <div className="pt-2">
                  <label className="flex items-center gap-3 p-4 border-2 border-zinc-100 rounded-xl cursor-pointer hover:border-indigo-200 transition">
                    <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} disabled={isSubmitting}/>
                    <div>
                      <div className="font-bold text-zinc-900">Mitarbeiter ist aktiv</div>
                      <div className="text-xs text-zinc-500 font-medium">Inaktive Mitarbeiter können sich nicht mehr einloggen, bleiben aber in der Historie erhalten.</div>
                    </div>
                  </label>
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className={cn("w-full text-white font-bold py-3.5 rounded-xl shadow-lg transition-transform active:scale-95 mt-4", isSubmitting ? "bg-zinc-400" : activeModal === 'password' ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20")}>
                {isSubmitting ? "Wird gespeichert..." : "Speichern"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}