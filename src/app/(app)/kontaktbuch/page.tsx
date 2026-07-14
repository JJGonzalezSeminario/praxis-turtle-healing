import { getSessionOrRedirect } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { KontaktbuchClient } from './KontaktbuchClient'

/**
 * Kontaktbuch-Seite als Server Component.
 *
 * Sicherheitsfix HOCH-1: Serverseitige isAdmin-Prüfung via role.slug (konsistent
 * mit allen anderen Seiten) statt des alten client-seitigen Checks via role.name.
 * Die Kontaktdaten werden serverseitig vorgeladen (kein fetchData-Roundtrip im Client).
 */
export default async function KontaktbuchPage() {
  const profile = await getSessionOrRedirect()
  const supabase = await createClient()

  // Daten serverseitig laden – kein zusätzlicher Client-Roundtrip nötig
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .order('name', { ascending: true })

  // HOCH-2 Fix: Konsistente Rollenprüfung über slug (nicht mehr über name)
  const isAdmin =
    profile.role?.slug === 'super_admin' ||
    profile.role?.slug === 'it_admin' ||
    profile.role?.slug === 'arzt'

  return (
    <KontaktbuchClient
      initialContacts={contacts ?? []}
      isAdmin={isAdmin}
    />
  )
}