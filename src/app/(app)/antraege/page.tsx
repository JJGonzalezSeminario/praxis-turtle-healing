import { getSessionOrRedirect } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { AntraegeClient } from './AntraegeClient'

export default async function AntraegePage() {
  const profile = await getSessionOrRedirect()
  const supabase = await createClient()

  const isAdmin =
    profile.role?.slug === 'super_admin' ||
    profile.role?.slug === 'arzt' ||
    profile.role?.slug === 'it_admin'

  const currentYear = new Date().getFullYear()

  let requests: any[] = []
  let leaveBalance = { total: 25, used: 0 }

  if (isAdmin) {
    // Admin: Alle Anträge inkl. Name des Antragstellers
    const { data } = await supabase
      .from('requests')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
    requests = data ?? []
  } else {
    // Mitarbeiter: Nur eigene Anträge + Urlaubssaldo parallel laden
    const [reqResult, balanceResult] = await Promise.all([
      supabase
        .from('requests')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('leave_balances')
        .select('total_days, used_days')
        .eq('user_id', profile.id)
        .eq('year', currentYear)
        .single(),
    ])

    requests = reqResult.data ?? []

    if (balanceResult.data) {
      leaveBalance = {
        total: balanceResult.data.total_days,
        used: balanceResult.data.used_days,
      }
    } else {
      // Saldo-Eintrag für das aktuelle Jahr anlegen falls nicht vorhanden
      await supabase.from('leave_balances').insert([{ user_id: profile.id, year: currentYear }])
    }
  }

  return (
    <AntraegeClient
      initialRequests={requests}
      isAdmin={isAdmin}
      userId={profile.id}
      leaveBalance={leaveBalance}
    />
  )
}