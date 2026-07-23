'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, AlertTriangle } from 'lucide-react'
import { updateShift, deleteShift } from '@/lib/actions/shifts'

export function EditShiftDialog({ shift, profiles }: { shift: any, profiles: any[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(shift.status)
  
  // NEU: Steuert, ob wir gerade die normale Ansicht oder die Lösch-Bestätigung zeigen
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false) 

  const isSick = shift.status === 'krank'
  const isVacation = shift.status === 'urlaub'
  const isTraining = shift.status === 'fortbildung'
  
  // HIER: Wir nutzen jetzt den sauberen Slug aus deiner DB
  const userRoleSlug = shift.profiles?.roles?.slug || 'pflege'

  // Standard-Farbe (Pflege/MFA = Smaragdgrün)
  let bgClass = "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/60"
  let timeText = `${shift.start_time.substring(0, 5)} - ${shift.end_time.substring(0, 5)}`

  // 1. Wenn aktiv, färbe nach dem Slug aus deiner Datenbank
  if (shift.status === 'aktiv') {
    if (userRoleSlug === 'arzt') {
      bgClass = "bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-300 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/60" // Ärzte = Blau
    } else if (userRoleSlug === 'physio' || userRoleSlug === 'therapeut') {
      bgClass = "bg-purple-50 dark:bg-purple-950/70 border-purple-200 dark:border-purple-800/60 text-purple-900 dark:text-purple-300 hover:bg-purple-100/70 dark:hover:bg-purple-900/60" // Physio = Lila
    } else if (userRoleSlug === 'reinigung') {
      bgClass = "bg-stone-50 dark:bg-zinc-800/80 border-stone-200 dark:border-zinc-700/60 text-stone-800 dark:text-zinc-300 hover:bg-stone-100/70 dark:hover:bg-zinc-700/60" // Reinigung = Grau
    } else if (userRoleSlug === 'super_admin' || userRoleSlug === 'it_admin') {
      bgClass = "bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60" // Admin = Grau
    }
  } 
  // 2. Abwesenheiten überschreiben die Rollenfarbe immer!
  else if (isSick) { 
    bgClass = "bg-red-50 dark:bg-rose-950/80 border-red-200 dark:border-rose-800/70 text-red-900 dark:text-rose-300 hover:bg-red-100 dark:hover:bg-rose-900/70 font-semibold"; 
    timeText = "Krank" 
  } else if (isVacation) { 
    bgClass = "bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/70 font-semibold"; 
    timeText = "Urlaub" 
  } else if (isTraining) { 
    bgClass = "bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800/70 text-blue-900 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/70 font-semibold"; 
    timeText = "Fortbildung" 
  }


  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const isAbsence = currentStatus !== 'aktiv'

    const data = {
      profile_id: formData.get('profile_id') as string,
      date: formData.get('date') as string,
      start_time: isAbsence ? '00:00' : (formData.get('start_time') as string),
      end_time: isAbsence ? '23:59' : (formData.get('end_time') as string),
      status: currentStatus,
      shift_type: isAbsence ? 'abwesenheit' : (formData.get('shift_type') as string),
    }

    const result = await updateShift(shift.id, data)
    setLoading(false)
    if (result?.success) {
      setOpen(false)
      setShowDeleteConfirm(false)
    }
  }

  // Das hässliche "confirm()" ist weg! Wir löschen jetzt direkt, da wir vorher im UI fragen.
  // Nimmt jetzt den Schalter entgegen
  const handleDelete = async (deleteGroup: boolean) => {
    setLoading(true)
    await deleteShift(shift.id, deleteGroup)
    setLoading(false)
    setOpen(false)
    setShowDeleteConfirm(false)
  }

  // Setzt die Ansicht zurück, wenn man das Fenster schließt
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) setShowDeleteConfirm(false)
  }

  return (
    <>
      <div 
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        // NEU: Responsive Paddings und runde Ecken (sm:...)
        className={`w-full flex items-center justify-between gap-1 p-0.5 px-1 sm:p-1 rounded-[3px] sm:rounded-md border ${bgClass} shadow-sm transition-all cursor-pointer print:border-none print:p-0`}
      >
        {/* NEU: Schriftgröße auf dem Handy winzig (text-[9px]), auf PC normal */}
        <span className="text-[9px] sm:text-[11px] font-bold sm:font-semibold truncate leading-tight sm:leading-none">
          {shift.profiles?.full_name?.split(' ')[0]}
        </span>
        {/* NEU: Uhrzeit auf dem Handy ausblenden (hidden sm:block) */}
        <span className="text-[10px] opacity-80 whitespace-nowrap leading-none font-medium hidden sm:block">
          {timeText}
        </span>
      </div>
      
      {/* ... DEIN BESTEHENDER DIALOG-CODE BLEIBT UNVERÄNDERT ... */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white transition-all">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-zinc-900">
              {showDeleteConfirm ? 'Eintrag löschen?' : 'Eintrag bearbeiten'}
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-500">
              {showDeleteConfirm 
                ? (shift.group_id 
                  ? 'Achtung: Dies löscht den gesamten zusammenhängenden Zeitraum!' 
                  : 'Diese Aktion kann nicht rückgängig gemacht werden.')
                : 'Ändern Sie die Daten oder löschen Sie den Eintrag.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            
            <div className={showDeleteConfirm ? 'hidden' : 'space-y-4'}>
              <div className="space-y-2">
                <Label htmlFor="profile_id">Mitarbeiter</Label>
                <select id="profile_id" name="profile_id" defaultValue={shift.user_id} required className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-emerald-600 bg-white">
                  {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Datum</Label>
                <Input id="date" name="date" type="date" defaultValue={shift.date} required className="rounded-lg" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {currentStatus === 'aktiv' ? (
                  <div className="space-y-2">
                    <Label htmlFor="shift_type">Schicht-Art</Label>
                    <select id="shift_type" name="shift_type" defaultValue={shift.shift_type} className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-emerald-600 bg-white">
                      <option value="regulär">Regulär</option>
                      <option value="frühschicht">Frühschicht</option>
                      <option value="spätschicht">Spätschicht</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2"><Label>Typ</Label><div className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-sm flex items-center text-zinc-500">Ganztägig</div></div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select id="status" name="status" value={currentStatus} onChange={(e) => setCurrentStatus(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-emerald-600 bg-white">
                    <option value="aktiv">Aktiv (Arbeitet)</option>
                    <option value="krank">Krank (Ausfall)</option>
                    <option value="urlaub">Urlaub</option>
                    <option value="fortbildung">Fortbildung</option>
                  </select>
                </div>
              </div>

              {currentStatus === 'aktiv' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Beginn</Label>
                    <Input id="start_time" name="start_time" type="time" defaultValue={shift.start_time.substring(0, 5)} required className="rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">Ende</Label>
                    <Input id="end_time" name="end_time" type="time" defaultValue={shift.end_time.substring(0, 5)} required className="rounded-lg" />
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="pt-4 flex flex-col gap-2">
              {!showDeleteConfirm ? (
                <div className="flex w-full items-center justify-between gap-4">
                  <Button type="button" variant="destructive" onClick={() => setShowDeleteConfirm(true)} className="rounded-xl flex-1 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-none">
                    <Trash2 size={16} className="mr-2" /> Löschen
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl">
                    {loading ? 'Lädt...' : 'Speichern'}
                  </Button>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
                  <div className="flex items-center justify-center p-3 rounded-lg bg-red-50 text-red-800 text-sm font-medium">
                    <AlertTriangle size={16} className="mr-2 text-red-600" />
                    Was möchten Sie löschen?
                  </div>
                  
                  {shift.group_id ? (
                    <div className="flex flex-col gap-2">
                      <Button type="button" variant="destructive" onClick={() => handleDelete(false)} disabled={loading} className="rounded-xl w-full bg-red-100 text-red-700 hover:bg-red-200 border-none">
                        Nur diesen Tag löschen
                      </Button>
                      <Button type="button" variant="destructive" onClick={() => handleDelete(true)} disabled={loading} className="rounded-xl w-full bg-red-600 hover:bg-red-700 text-white">
                        Gesamten Zeitraum löschen
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowDeleteConfirm(false)} className="rounded-xl w-full border-zinc-200 mt-2">
                        Abbrechen
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <Button type="button" variant="outline" onClick={() => setShowDeleteConfirm(false)} className="rounded-xl flex-1 border-zinc-200">
                        Abbrechen
                      </Button>
                      <Button type="button" variant="destructive" onClick={() => handleDelete(false)} disabled={loading} className="rounded-xl flex-1 bg-red-600 hover:bg-red-700 text-white">
                        {loading ? 'Löscht...' : 'Endgültig löschen'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}