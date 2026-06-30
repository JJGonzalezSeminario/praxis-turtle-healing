import { getSessionOrRedirect } from '@/lib/auth/get-session'
import { redirect } from 'next/navigation'

/**
 * Admin-Layout: Rollen-Guard für alle Seiten unter /admin
 *
 * Fix #6: Dieser Server-seitige Guard stellt sicher, dass NUR Super Admins
 * auf Admin-Seiten zugreifen können. Die Middleware allein prüft nur Auth (eingeloggt ja/nein),
 * nicht die Rolle. Dieses Layout schließt diese Lücke serverseitig.
 *
 * Nicht-Admins werden sofort zum Dashboard weitergeleitet — ohne dass die Seite
 * auch nur ansatzweise gerendert wird.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionOrRedirect()

  if (!profile.is_super_admin) {
    // Kein Super Admin → sofort zurück zum Dashboard
    redirect('/dashboard')
  }

  return <>{children}</>
}
