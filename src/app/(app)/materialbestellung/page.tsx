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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select('id, name, category, pzn, status, min_stock, current_stock, shop_url') as any,
    supabase
      .from('material_orders')
      .select('id, created_at, items, profiles(full_name)')
      .order('created_at', { ascending: false }),
  ])

  const inventoryResult2 = inventoryResult as { data: any[] | null; error: any }

  // Fallback: falls current_stock-Spalte noch nicht existiert, ohne sie laden
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let inventoryData: any[] | null = inventoryResult2.data
  if (inventoryResult2.error && !inventoryData) {
    const fallback = await supabase
      .from('inventory')
      .select('id, name, category, pzn, status, min_stock, shop_url')
      .order('category', { ascending: true })
      .order('name', { ascending: true })
    inventoryData = fallback.data as any[] | null
  }

  const isAdmin =
    profile.role?.slug === 'super_admin' ||
    profile.role?.slug === 'it_admin' ||
    profile.role?.slug === 'arzt'

  return (
    <MaterialbestellungClient
      initialInventory={(inventoryData ?? []).map((item: any) => ({
        ...item,
        current_stock: item.current_stock ?? 0,
      }))}
      initialOrders={ordersResult.data ?? []}
      isAdmin={isAdmin}
      userId={profile.id}
    />
  )
}