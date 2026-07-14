'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

// ─── Admin-Client (per Request, nicht auf Modul-Ebene) ──────────────────────
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Supabase Admin-Credentials fehlen. Bitte NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY in .env.local prüfen.'
    )
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ─── Authorisierungs-Guard ──────────────────────────────────────────────────
async function requireSuperAdmin() {
  const supabase = await createServerClient()
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

  if (roleSlug !== 'super_admin') {
    throw new Error('Zugriff verweigert. Diese Aktion ist ausschließlich Super Admins vorbehalten.')
  }

  return user
}

// ─── Audit-Logging Hilfsfunktion ───────────────────────────────────────────
// Protokolliert administrative Aktionen manipulationssicher unter Umgehung von RLS
async function logAdminAction(
  actorId: string,
  action: 'CREATE_USER' | 'UPDATE_USER' | 'RESET_PASSWORD',
  targetUserId: string,
  details: Record<string, any> = {}
) {
  try {
    const supabaseAdmin = getAdminClient()
    const { error } = await supabaseAdmin.from('audit_logs').insert({
      actor_id: actorId,
      action,
      target_user_id: targetUserId,
      details,
    })
    if (error) throw error
  } catch (err) {
    // Protokollierung darf die Hauptaktion nicht blockieren, aber wir loggen Fehler
    console.error('Audit Log konnte nicht geschrieben werden:', err)
  }
}

// ─── Typen ──────────────────────────────────────────────────────────────────

interface CreateUserData {
  email: string
  password: string
  full_name: string
  role_id: string
}

interface UpdateUserData {
  email: string
  full_name: string
  role_id: string
  is_active: boolean
}

// ─── Server Actions ─────────────────────────────────────────────────────────

export async function createUser(data: CreateUserData) {
  let actorUser
  try {
    actorUser = await requireSuperAdmin()
  } catch (e: any) {
    return { error: e.message }
  }

  // MITTEL-3: Passwort-Stärkenvalidierung (analog zu resetPassword)
  if (!data.password || data.password.length < 8) {
    return { error: 'Das Passwort muss mindestens 8 Zeichen lang sein.' }
  }
  const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/
  if (!passwordRegex.test(data.password)) {
    return { error: 'Das Passwort muss mindestens einen Großbuchstaben und eine Zahl enthalten.' }
  }

  try {
    const supabaseAdmin = getAdminClient()

    // 1. Nutzer in Supabase Auth anlegen
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    })

    if (authError) throw authError

    const userId = authData.user.id

    // 2. Profil in der Datenbank erstellen (kein automatischer Trigger aktiv)
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      full_name: data.full_name,
      role_id: data.role_id,
      is_active: true,
      email: data.email,
    })

    if (profileError) throw profileError

    // 3. Protokollieren
    await logAdminAction(actorUser.id, 'CREATE_USER', userId, {
      full_name: data.full_name,
      email: data.email,
      role_id: data.role_id,
    })

    return { success: true }
  } catch (error: any) {
    console.error('createUser Fehler:', error)
    return { error: error.message }
  }
}

export async function updateUser(userId: string, data: UpdateUserData) {
  let actorUser
  try {
    actorUser = await requireSuperAdmin()
  } catch (e: any) {
    return { error: e.message }
  }

  try {
    const supabaseAdmin = getAdminClient()

    // Vorherige Daten für detaillierten Audit-Log holen
    const { data: oldProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, role_id, is_active')
      .eq('id', userId)
      .single()

    // E-Mail in Supabase Auth aktualisieren
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: data.email,
    })
    if (authError) throw authError

    // Profil in der Datenbank aktualisieren
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: data.full_name,
        role_id: data.role_id,
        is_active: data.is_active,
        email: data.email,
      })
      .eq('id', userId)

    if (profileError) throw profileError

    // Protokollieren
    const changes: Record<string, any> = {}
    if (oldProfile) {
      if (oldProfile.full_name !== data.full_name) changes.full_name = { old: oldProfile.full_name, new: data.full_name }
      if (oldProfile.email !== data.email) changes.email = { old: oldProfile.email, new: data.email }
      if (oldProfile.role_id !== data.role_id) changes.role_id = { old: oldProfile.role_id, new: data.role_id }
      if (oldProfile.is_active !== data.is_active) changes.is_active = { old: oldProfile.is_active, new: data.is_active }
    }

    await logAdminAction(actorUser.id, 'UPDATE_USER', userId, {
      changes,
    })

    return { success: true }
  } catch (error: any) {
    console.error('updateUser Fehler:', error)
    return { error: error.message }
  }
}

export async function resetPassword(userId: string, newPassword: string) {
  let actorUser
  try {
    actorUser = await requireSuperAdmin()
  } catch (e: any) {
    return { error: e.message }
  }

  if (!newPassword || newPassword.length < 8) {
    return { error: 'Das Passwort muss mindestens 8 Zeichen lang sein.' }
  }

  try {
    const supabaseAdmin = getAdminClient()
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    })
    if (error) throw error

    // Protokollieren (Passwort im Klartext wird NIE protokolliert!)
    await logAdminAction(actorUser.id, 'RESET_PASSWORD', userId)

    return { success: true }
  } catch (error: any) {
    console.error('resetPassword Fehler:', error)
    return { error: error.message }
  }
}