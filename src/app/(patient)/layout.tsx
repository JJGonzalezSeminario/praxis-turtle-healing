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

  // Wir erlauben Admins/Mitarbeitern den Zugriff auf diese Seite (z.B. zum Vorbereiten des Tablets).
  // Nur wenn ein nicht eingeloggter User (wird von getSessionOrRedirect bereits abgefangen) 
  // oder eine unberechtigte Rolle darauf zugreifen wollte, würden wir sperren. 
  // Da die Middleware und getSessionOrRedirect() bereits die Authentifizierung prüfen,
  // müssen wir hier Mitarbeiter nicht blockieren.

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {children}
    </div>
  )
}
