import { getSessionOrRedirect } from '@/lib/auth/get-session'
import { redirect } from 'next/navigation'

/**
 * Patient Route Group Layout
 *
 * Dieses Layout schützt den (patient)-Bereich in die andere Richtung:
 * Nur Nutzer mit der Rolle "patient" dürfen hier rein.
 * Alle anderen (Staff) werden sofort zum Dashboard weitergeleitet.
 */
export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionOrRedirect()

  // Nicht-Patienten (Staff, Admins) aus dem Tablet-Bereich heraushalten
  if (profile.role?.slug !== 'patient') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {children}
    </div>
  )
}
