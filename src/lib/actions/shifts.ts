'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAuditAction } from '@/lib/actions/audit'

// ─── Authorisierungs-Guard ──────────────────────────────────────────────────
// Prüft serverseitig, ob der aktuell eingeloggte Nutzer authentifiziert ist.
// Jede angemeldete Rolle darf Schichten bearbeiten.
async function requireAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Nicht authentifiziert. Bitte neu einloggen.')
  }

  return user
}

// ─── Typen ──────────────────────────────────────────────────────────────────

interface ShiftCreateData {
  profile_id: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  status: string
  shift_type: string
}

interface ShiftUpdateData {
  profile_id: string
  date: string
  start_time: string
  end_time: string
  status: string
  shift_type: string
}

// ─── Server Actions ─────────────────────────────────────────────────────────

export async function createShift(formData: ShiftCreateData) {
  let actorUser
  try {
    actorUser = await requireAuthUser()
  } catch (e: any) {
    return { error: e.message }
  }

  const supabase = await createClient()

  const start = new Date(formData.start_date)
  const end = new Date(formData.end_date)

  // Validierung: Enddatum darf nicht vor Startdatum liegen
  if (end < start) {
    return { error: 'Das Enddatum darf nicht vor dem Startdatum liegen.' }
  }

  const shiftsToInsert = []

  // Einzigartiger "Stempel" für diesen kompletten Zeitraum (Gruppen-Löschung)
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
        group_id: groupId,
      })
    }
  }

  if (shiftsToInsert.length === 0) {
    return { error: 'Im gewählten Zeitraum liegen keine Werktage. Es wurden keine Schichten erstellt.' }
  }

  const { error } = await supabase.from('shifts').insert(shiftsToInsert)

  if (error) {
    console.error('Fehler beim Erstellen der Schichten:', error)
    return { error: 'Einträge konnten nicht gespeichert werden.' }
  }

  // Protokollieren
  await logAuditAction(actorUser.id, 'CREATE_SHIFT', formData.profile_id, {
    start_date: formData.start_date,
    end_date: formData.end_date,
    start_time: formData.start_time,
    end_time: formData.end_time,
    status: formData.status,
    shift_type: formData.shift_type,
    count: shiftsToInsert.length,
  })

  revalidatePath('/dienstplan')
  return { success: true }
}

export async function updateShift(id: string, data: ShiftUpdateData) {
  let actorUser
  try {
    actorUser = await requireAuthUser()
  } catch (e: any) {
    return { error: e.message }
  }

  const supabase = await createClient()

  // Vorherigen Zustand laden für Audit-Log Diff
  const { data: oldShift } = await supabase
    .from('shifts')
    .select('user_id, date, start_time, end_time, status, shift_type')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('shifts')
    .update({
      user_id: data.profile_id,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      status: data.status,
      shift_type: data.shift_type,
    })
    .eq('id', id)

  if (error) return { error: 'Eintrag konnte nicht aktualisiert werden.' }

  // Diff berechnen und protokollieren
  const changes: Record<string, any> = {}
  if (oldShift) {
    if (oldShift.user_id !== data.profile_id) changes.profile_id = { old: oldShift.user_id, new: data.profile_id }
    if (oldShift.date !== data.date) changes.date = { old: oldShift.date, new: data.date }
    if (oldShift.start_time !== data.start_time) changes.start_time = { old: oldShift.start_time, new: data.start_time }
    if (oldShift.end_time !== data.end_time) changes.end_time = { old: oldShift.end_time, new: data.end_time }
    if (oldShift.status !== data.status) changes.status = { old: oldShift.status, new: data.status }
    if (oldShift.shift_type !== data.shift_type) changes.shift_type = { old: oldShift.shift_type, new: data.shift_type }
  }

  await logAuditAction(actorUser.id, 'UPDATE_SHIFT', data.profile_id, {
    shift_id: id,
    date: data.date,
    changes,
  })

  revalidatePath('/dienstplan')
  return { success: true }
}

export async function deleteShift(id: string, deleteGroup: boolean = false) {
  let actorUser
  try {
    actorUser = await requireAuthUser()
  } catch (e: any) {
    return { error: e.message }
  }

  const supabase = await createClient()

  // Vorherige Details für Audit-Log laden
  const { data: oldShift } = await supabase
    .from('shifts')
    .select('user_id, date, start_time, end_time, status, shift_type, group_id')
    .eq('id', id)
    .single()

  let query = supabase.from('shifts').delete()

  if (deleteGroup) {
    if (oldShift?.group_id) {
      query = query.eq('group_id', oldShift.group_id)
    } else {
      query = query.eq('id', id)
    }
  } else {
    query = query.eq('id', id)
  }

  const { error } = await query

  if (error) return { error: 'Eintrag konnte nicht gelöscht werden.' }

  await logAuditAction(actorUser.id, 'DELETE_SHIFT', oldShift?.user_id || null, {
    shift_id: id,
    date: oldShift?.date,
    start_time: oldShift?.start_time,
    end_time: oldShift?.end_time,
    status: oldShift?.status,
    shift_type: oldShift?.shift_type,
    delete_group: deleteGroup,
  })

  revalidatePath('/dienstplan')
  return { success: true }
}