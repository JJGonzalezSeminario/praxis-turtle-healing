import { getSessionOrRedirect } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { DokumenteClient } from './DokumenteClient'

export default async function DokumentencenterPage() {
  const profile = await getSessionOrRedirect()
  const supabase = await createClient()

  const { data: documents } = await supabase
    .from('documents')
    .select('id, title, category, file_url, file_size, created_at, profiles(full_name)')
    .order('created_at', { ascending: false })

  const isAdmin =
    profile.role?.slug === 'super_admin' ||
    profile.role?.slug === 'it_admin' ||
    profile.role?.slug === 'arzt'

  return (
    <DokumenteClient
      initialDocuments={documents ?? []}
      isAdmin={isAdmin}
      userId={profile.id}
    />
  )
}