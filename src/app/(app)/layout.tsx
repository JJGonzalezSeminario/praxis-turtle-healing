import { getSessionOrRedirect } from '@/lib/auth/get-session'
import { AppShell } from '@/components/shell/AppShell'
import { SessionProvider } from '@/providers/SessionProvider'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionOrRedirect()

  // PATIENTEN-LOCKDOWN: Jeder Nutzer mit der Rolle "patient", der versucht
  // eine beliebige Route im (app)-Segment aufzurufen (/dienstplan, /materialbestellung,
  // /dokumente, /admin, etc.), wird hier serverseitig blockiert und umgeleitet.
  // Dieser Guard schützt ALLE 10+ Unterseiten auf einmal.
  if (profile.role?.slug === 'patient') {
    redirect('/patientenaufnahme')
  }

  return (
    <SessionProvider profile={profile}>
      <AppShell profile={profile}>
        {children}
      </AppShell>
    </SessionProvider>
  )
}