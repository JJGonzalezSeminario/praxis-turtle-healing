'use server'

import { createClient } from '@supabase/supabase-js'

// Generalschlüssel laden
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

export async function createUser(data: { email: string, password: string, full_name: string, role_id: string }) {
  try {
    // 1. Nutzer im Tresor (Auth) anlegen
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name }
    })
    if (authError) throw authError

    const userId = authData.user.id

    // 2. Warten, bis der Datenbank-Trigger das Profil erstellt hat, dann updaten
    await new Promise(resolve => setTimeout(resolve, 500)) 

    const { error: profileError } = await supabaseAdmin.from('profiles').update({
      full_name: data.full_name,
      role_id: data.role_id,
      is_active: true,
      email: data.email // <--- NEU: Speichert die E-Mail jetzt auch im sichtbaren Profil!
    }).eq('id', userId)

    if (profileError) throw profileError
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateUser(userId: string, data: { email: string, full_name: string, role_id: string, is_active: boolean }) {
  try {
    // E-Mail im Tresor ändern
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, { email: data.email })
    if (authError) throw authError

    // Profil in der Datenbank ändern
    const { error: profileError } = await supabaseAdmin.from('profiles').update({
      full_name: data.full_name,
      role_id: data.role_id,
      is_active: data.is_active,
      email: data.email // <--- NEU: Speichert die E-Mail jetzt auch im sichtbaren Profil!
    }).eq('id', userId)

    if (profileError) throw profileError
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function resetPassword(userId: string, newPassword: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword })
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}