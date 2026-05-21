import { redirect } from 'next/navigation'

export default function RootPage() {
  // Leitet jeden, der die Hauptseite aufruft, sofort zum Dashboard weiter
  redirect('/dashboard')
}