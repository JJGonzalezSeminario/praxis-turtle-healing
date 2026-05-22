import { createClient } from '@/lib/supabase/server'

export async function getShifts(startDate: string, endDate: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('shifts')
    .select(`
      *,
      profiles!shifts_user_id_fkey (
        full_name, 
        initials,
        roles ( name, slug )
      )
    `)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) {
    console.error('Fehler beim Laden der Schichten:', error)
    return []
  }
  
  return data
}