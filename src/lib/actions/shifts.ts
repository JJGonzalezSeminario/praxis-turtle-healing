'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createShift(formData: {
  profile_id: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  status: string
  shift_type: string
}) {
  const supabase = await createClient()

  const start = new Date(formData.start_date)
  const end = new Date(formData.end_date)
  const shiftsToInsert = []

  // NEU: Wir generieren einen einzigartigen "Stempel" für diesen kompletten Zeitraum
  const groupId = crypto.randomUUID()

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      shiftsToInsert.push({
        user_id: formData.profile_id,
        date: d.toISOString().split('T')[0],
        start_time: formData.start_time,
        end_time: formData.end_time,
        status: formData.status,
        shift_type: formData.shift_type,
        group_id: groupId // Der Stempel wird jedem Tag dieses Zeitraums angeheftet
      })
    }
  }

  const { error } = await supabase.from('shifts').insert(shiftsToInsert)

  if (error) {
    console.error('Fehler beim Erstellen der Schichten:', error)
    return { error: 'Einträge konnten nicht gespeichert werden.' }
  }

  revalidatePath('/dienstplan')
  return { success: true }
}

export async function updateShift(id: string, data: any) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('shifts')
    .update({
      user_id: data.profile_id,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      status: data.status,
      shift_type: data.shift_type
    })
    .eq('id', id)

  if (error) return { error: 'Eintrag konnte nicht aktualisiert werden.' }
  
  revalidatePath('/dienstplan')
  return { success: true }
}

export async function deleteShift(id: string, deleteGroup: boolean = false) {
  const supabase = await createClient()
  
  let query = supabase.from('shifts').delete()

  if (deleteGroup) {
    // Wenn die Gruppe gelöscht werden soll, suchen wir erst den Stempel
    const { data: shift } = await supabase.from('shifts').select('group_id').eq('id', id).single()
    if (shift?.group_id) {
      query = query.eq('group_id', shift.group_id)
    } else {
      query = query.eq('id', id) // Falls es unerwartet keine Gruppe gibt, lösche nur den Tag
    }
  } else {
    // Wenn NICHT die Gruppe gelöscht werden soll, lösche exakt nur diesen Tag
    query = query.eq('id', id)
  }

  const { error } = await query

  if (error) return { error: 'Eintrag konnte nicht gelöscht werden.' }
  
  revalidatePath('/dienstplan')
  return { success: true }
}