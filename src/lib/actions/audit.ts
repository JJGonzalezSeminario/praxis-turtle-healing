'use server'

import { createClient } from '@supabase/supabase-js'

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

export type AuditAction =
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'RESET_PASSWORD'
  | 'CREATE_SHIFT'
  | 'UPDATE_SHIFT'
  | 'DELETE_SHIFT'

export async function logAuditAction(
  actorId: string,
  action: AuditAction,
  targetUserId: string | null,
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
    console.error('Audit Log konnte nicht geschrieben werden:', err)
  }
}
