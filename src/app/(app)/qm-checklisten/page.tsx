import { createClient } from '@/lib/supabase/server'
import { QMView } from './QMView'

export default async function QMPage() {
  const supabase = await createClient()

  const { data: checklists } = await supabase
    .from('checklists')
    .select(`
      id, title, description, icon,
      checklist_items ( id, task_text, sort_order, guide_images )
    `)
    .order('created_at', { ascending: true })

  const formattedChecklists = checklists?.map(list => ({
    ...list,
    checklist_items: list.checklist_items.sort((a: any, b: any) => a.sort_order - b.sort_order)
  })) || []

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8">
      <QMView initialChecklists={formattedChecklists} />
    </div>
  )
}