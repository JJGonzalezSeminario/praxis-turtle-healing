import { getSessionOrRedirect } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { MaterialbestellungClient } from './MaterialbestellungClient'

export default async function MaterialbestellungPage() {
  const profile = await getSessionOrRedirect()
  const supabase = await createClient()

  // Alle Daten parallel laden — kein sequenzielles Warten mehr
  const [inventoryResult, ordersResult] = await Promise.all([
    supabase
      .from('inventory')
      .select('id, name, category, pzn, status, min_stock')
      .order('name', { ascending: true }),
    supabase
      .from('material_orders')
      .select('id, created_at, items, profiles(full_name)')
      .order('created_at', { ascending: false }),
  ])

  const isAdmin =
    profile.role?.slug === 'super_admin' ||
    profile.role?.slug === 'it_admin' ||
    profile.role?.slug === 'arzt'

  return (
    <MaterialbestellungClient
      initialInventory={inventoryResult.data ?? []}
      initialOrders={ordersResult.data ?? []}
      isAdmin={isAdmin}
      userId={profile.id}
    />
  )
}