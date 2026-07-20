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
      .select('id, name, category, pzn, status, min_stock, current_stock, shop_url')
      .order('category', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('material_orders')
      .select('id, created_at, items, profiles(full_name)')
      .order('created_at', { ascending: false }),
  ])

  // Fallback: falls current_stock-Spalte noch nicht existiert, ohne sie laden
  let inventoryData = inventoryResult.data
  if (inventoryResult.error && !inventoryData) {
    const fallback = await supabase
      .from('inventory')
      .select('id, name, category, pzn, status, min_stock, shop_url')
      .order('category', { ascending: true })
      .order('name', { ascending: true })
    inventoryData = fallback.data
  }

  const isAdmin =
    profile.role?.slug === 'super_admin' ||
    profile.role?.slug === 'it_admin' ||
    profile.role?.slug === 'arzt'

  return (
    <MaterialbestellungClient
      initialInventory={(inventoryData ?? []).map(item => ({
        ...item,
        current_stock: (item as any).current_stock ?? 0,
      }))}
      initialOrders={ordersResult.data ?? []}
      isAdmin={isAdmin}
      userId={profile.id}
    />
  )
}