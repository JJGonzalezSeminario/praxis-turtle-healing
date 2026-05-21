import { createClient } from '@/lib/supabase/server'
import type { UserProfile } from '@/types/permissions'
import { redirect } from 'next/navigation'

export async function getSessionOrRedirect(): Promise<UserProfile> {
  const supabase = await createClient()

  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session) {
    redirect('/login')
  }

  // Profil + Rolle + Berechtigungen in einem Join laden
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      initials,
      avatar_url,
      role_id,
      roles (
        id,
        name,
        slug,
        color
      ),
      roles!inner (
        role_permissions (
          resource,
          action
        )
      )
    `)
    .eq('id', session.user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  // Rechte-Array flach machen
  const permissions = (profile.roles?.role_permissions ?? []).map((p: any) => ({
    resource: p.resource,
    action: p.action,
  }))

  return {
    id: profile.id,
    full_name: profile.full_name,
    initials: profile.initials,
    avatar_url: profile.avatar_url,
    role_id: profile.role_id,
    role: profile.roles
      ? { id: profile.roles.id, name: profile.roles.name, slug: profile.roles.slug, color: profile.roles.color }
      : null,
    permissions,
    is_super_admin: profile.roles?.slug === 'super_admin',
  }
}