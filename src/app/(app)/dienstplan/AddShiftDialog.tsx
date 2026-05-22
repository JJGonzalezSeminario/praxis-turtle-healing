'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { createShift } from '@/lib/actions/shifts'

export function AddShiftDialog({ 
  profiles, 
  defaultDate, // NEU: Nimmt ein Start-Datum an
  trigger      // NEU: Nimmt ein klickbares Element an
}: { 
  profiles: any[], 
  defaultDate?: string, 
  trigger?: React.ReactNode 
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  // NEU: Wir merken uns den aktuell ausgewählten Status im Formular
  const [currentStatus, setCurrentStatus] = useState('aktiv')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const isAbsence = currentStatus !== 'aktiv'

    const data = {
      profile_id: formData.get('profile_id') as string,
      start_date: formData.get('start_date') as string,
      end_date: formData.get('end_date') as string,
      // Wenn Abwesenheit, speichern wir 00:00 bis 23:59, ansonsten die gewählte Uhrzeit
      start_time: isAbsence ? '00:00' : (formData.get('start_time') as string),
      end_time: isAbsence ? '23:59' : (formData.get('end_time') as string),
      status: currentStatus,
      shift_type: isAbsence ? 'abwesenheit' : (formData.get('shift_type') as string),
    }

    const result = await createShift(data)
    
    setLoading(false)
    if (result?.success) {
      setOpen(false)
      setCurrentStatus('aktiv') // Reset für das nächste Mal
    }
  }

  return (
    <>
      {/* 100% ausfallsicherer manueller Trigger (kein asChild-Konflikt mehr!) */}
      {trigger ? (
        <div onClick={(e) => { e.stopPropagation(); setOpen(true); }} className="contents">
          {trigger}
        </div>
      ) : (
        <Button onClick={() => setOpen(true)} className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-sm">
          <Plus size={18} className="mr-2" /> Eintrag hinzufügen
        </Button>
      )}

      {/* Das Fenster selbst */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-zinc-900">Schicht / Ausfall planen</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500">
              Wählen Sie den Zeitraum. Wochenenden werden automatisch übersprungen.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="profile_id">Mitarbeiter</Label>
            <select
              id="profile_id"
              name="profile_id"
              required
              className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
            >
              <option value="">Mitarbeiter wählen...</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Von (Datum)</Label>
              <Input id="start_date" name="start_date" type="date" defaultValue={defaultDate} required className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Bis (Datum)</Label>
              <Input id="end_date" name="end_date" type="date" defaultValue={defaultDate} required className="rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Schicht-Art wird nur angezeigt, wenn der Mitarbeiter aktiv arbeitet */}
            {currentStatus === 'aktiv' ? (
              <div className="space-y-2">
                <Label htmlFor="shift_type">Schicht-Art</Label>
                <select
                  id="shift_type"
                  name="shift_type"
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  <option value="regulär">Regulär</option>
                  <option value="frühschicht">Frühschicht</option>
                  <option value="spätschicht">Spätschicht</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Typ</Label>
                <div className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-sm flex items-center text-zinc-500">
                  Ganztägig
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                value={currentStatus}
                onChange={(e) => setCurrentStatus(e.target.value)} // NEU: Aktualisiert den Status live
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
              >
                <option value="aktiv">Aktiv (Arbeitet)</option>
                <option value="krank">Krank (Ausfall)</option>
                <option value="urlaub">Urlaub</option>
                <option value="fortbildung">Fortbildung</option>
              </select>
            </div>
          </div>

          {/* DYNAMISCH: Diese Zeile wird komplett versteckt, wenn es sich um Urlaub/Krankheit handelt */}
          {currentStatus === 'aktiv' && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
              <div className="space-y-2">
                <Label htmlFor="start_time">Beginn</Label>
                <Input id="start_time" name="start_time" type="time" defaultValue="09:00" required className="rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Ende</Label>
                <Input id="end_time" name="end_time" type="time" defaultValue="18:00" required className="rounded-lg" />
              </div>
            </div>
          )}
          
          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl py-6 font-medium"
            >
              {loading ? 'Wird gespeichert...' : 'Eintrag speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}