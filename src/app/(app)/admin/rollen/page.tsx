'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Lock, Check, X, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

// Alle verfügbaren App-Module
const MODULES = [
  { id: 'patient_intake', name: 'Patientenaufnahme' },
  { id: 'requests', name: 'Urlaub & Anträge' },
  { id: 'contacts', name: 'Kontaktbuch' },
  { id: 'orders', name: 'Materialbestellung' },
  { id: 'documents', name: 'Dokumentencenter' },
]

export default function RechteVerwaltungPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  
  const [roles, setRoles] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    // 1. Alle Rollen laden
    const { data: rolesData } = await supabase.from('roles').select('*').order('name')
    setRoles(rolesData || [])
    
    // 2. Alle vergebenen Rechte laden
    const { data: permsData } = await supabase.from('role_permissions').select('*').eq('action', 'view')
    setPermissions(permsData || [])
    
    if (rolesData && rolesData.length > 0 && !selectedRoleId) {
      setSelectedRoleId(rolesData[0].id)
    }
    setLoading(false)
  }

  // Prüft, ob eine Rolle ein bestimmtes Modul sehen darf
  const hasPermission = (roleId: string, resource: string) => {
    return permissions.some(p => p.role_id === roleId && p.resource === resource)
  }

  // Schalter umlegen (Recht hinzufügen oder entfernen)
  const togglePermission = async (resource: string, currentlyHasPerm: boolean) => {
    if (!selectedRoleId) return

    // Optisches Sofort-Update (Snappy UI)
    if (currentlyHasPerm) {
      setPermissions(permissions.filter(p => !(p.role_id === selectedRoleId && p.resource === resource)))
      await supabase.from('role_permissions').delete().match({ role_id: selectedRoleId, resource: resource, action: 'view' })
    } else {
      const newPerm = { role_id: selectedRoleId, resource: resource, action: 'view' }
      setPermissions([...permissions, newPerm])
      await supabase.from('role_permissions').insert([newPerm])
    }
  }

  const selectedRole = roles.find(r => r.id === selectedRoleId)
  const isProtectedAdmin = selectedRole?.name === 'Super Admin' || selectedRole?.name === 'IT-Admin'

  if (loading) return <div className="p-10 text-center font-bold text-zinc-500">Lade Rechteverwaltung...</div>

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">
      
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-3">
          <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
            <Shield size={28} />
          </div>
          Rollen & Rechte
        </h1>
        <p className="text-zinc-500 font-medium mt-2">
          Lege fest, welche Berufsgruppen Zugriff auf welche Praxis-Module haben.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* LINKE SPALTE: ROLLEN-LISTE */}
        <div className="w-full md:w-1/3 space-y-2">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 px-2">Verfügbare Rollen</h3>
          {roles.map(role => {
            const isAdmin = role.name === 'Super Admin' || role.name === 'IT-Admin'
            const isSelected = role.id === selectedRoleId
            
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group",
                  isSelected 
                    ? "bg-zinc-900 text-white shadow-md" 
                    : "bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
                )}
              >
                <span className="font-extrabold">{role.name}</span>
                {isAdmin && <ShieldAlert size={16} className={cn(isSelected ? "text-rose-400" : "text-rose-500")} />}
              </button>
            )
          })}
        </div>

        {/* RECHTE SPALTE: SCHALTER-MATRIX */}
        <div className="w-full md:w-2/3">
          <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
            
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-xl font-extrabold text-zinc-900 flex items-center gap-2">
                Zugriffsrechte: {selectedRole?.name}
              </h2>
            </div>

            {isProtectedAdmin ? (
              // ADMINS: GESPERRTE ANSICHT
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-6">
                  <Lock size={32} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-extrabold text-zinc-900 mb-2">Systemweit gesperrt</h3>
                <p className="text-zinc-500 font-medium max-w-sm">
                  Diese Rolle hat immer vollständigen Vollzugriff auf alle Bereiche der App. Zu deiner eigenen Sicherheit können diese Rechte nicht entfernt werden.
                </p>
              </div>
            ) : (
              // NORMALE MITARBEITER: SCHALTER
              <div className="divide-y divide-zinc-100">
                {MODULES.map(mod => {
                  const hasPerm = hasPermission(selectedRoleId!, mod.id)
                  
                  return (
                    <div key={mod.id} className="p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                      <div>
                        <h4 className="text-lg font-extrabold text-zinc-900">{mod.name}</h4>
                        <p className="text-sm font-medium text-zinc-500 mt-0.5">
                          Darf das Modul in der Sidebar sehen und öffnen.
                        </p>
                      </div>
                      
                      <button
                        onClick={() => togglePermission(mod.id, hasPerm)}
                        className={cn(
                          "relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none shadow-inner flex items-center shrink-0",
                          hasPerm ? "bg-emerald-500" : "bg-zinc-200"
                        )}
                      >
                        <div className={cn(
                          "absolute w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center",
                          hasPerm ? "translate-x-9" : "translate-x-1"
                        )}>
                          {hasPerm ? <Check size={14} className="text-emerald-600" strokeWidth={4}/> : <X size={14} className="text-zinc-400" strokeWidth={4}/>}
                        </div>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}