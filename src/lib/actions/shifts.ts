'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Authorisierungs-Guard ──────────────────────────────────────────────────
// Prüft serverseitig, ob der aktuell eingeloggte Nutzer eine der erlaubten
// Rollen besitzt. Wirft einen Fehler, wenn nicht — so sind alle Actions gesichert.
async function requireRole(allowedSlugs: string[]) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Nicht authentifiziert. Bitte neu einloggen.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('roles(slug)')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profil konnte nicht geladen werden.')
  }

  const roleSlug = (profile as any)?.roles?.slug as string | undefined

  if (!roleSlug || !allowedSlugs.includes(roleSlug)) {
    throw new Error(`Zugriff verweigert. Diese Aktion erfordert eine der Rollen: ${allowedSlugs.join(', ')}.`)
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
  try {
    // Nur Super Admin und Leitungskräfte dürfen Schichten anlegen
    await requireRole(['super_admin', 'it_admin', 'arzt'])
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

  revalidatePath('/dienstplan')
  return { success: true }
}

export async function updateShift(id: string, data: ShiftUpdateData) {
  try {
    // Nur Berechtigte dürfen Schichten bearbeiten
    await requireRole(['super_admin', 'it_admin', 'arzt'])
  } catch (e: any) {
    return { error: e.message }
  }

  const supabase = await createClient()

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

  revalidatePath('/dienstplan')
  return { success: true }
}

export async function deleteShift(id: string, deleteGroup: boolean = false) {
  try {
    // Nur Berechtigte dürfen Schichten löschen
    await requireRole(['super_admin', 'it_admin', 'arzt'])
  } catch (e: any) {
    return { error: e.message }
  }

  const supabase = await createClient()

  let query = supabase.from('shifts').delete()

  if (deleteGroup) {
    // Wenn die Gruppe gelöscht werden soll, suchen wir erst den Stempel
    const { data: shift } = await supabase.from('shifts').select('group_id').eq('id', id).single()
    if (shift?.group_id) {
      query = query.eq('group_id', shift.group_id)
    } else {
      // Falls keine Gruppe existiert, nur diesen einzelnen Tag löschen
      query = query.eq('id', id)
    }
  } else {
    // Exakt nur diesen Tag löschen
    query = query.eq('id', id)
  }

  const { error } = await query

  if (error) return { error: 'Eintrag konnte nicht gelöscht werden.' }

  revalidatePath('/dienstplan')
  return { success: true }
}