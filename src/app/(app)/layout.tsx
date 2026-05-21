import { getSessionOrRedirect } from '@/lib/auth/get-session'
import { AppShell } from '@/components/shell/AppShell'
import { SessionProvider } from '@/providers/SessionProvider'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Profil und Rechte werden serverseitig geladen
  const profile = await getSessionOrRedirect()

  return (
    <SessionProvider profile={profile}>
      <AppShell profile={profile}>
        {children}
      </AppShell>
    </SessionProvider>
  )
}