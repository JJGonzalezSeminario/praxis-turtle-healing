import { createClient } from '@/lib/supabase/server'
import { WikiView } from './WikiView'

export default async function WikiPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase.from('wiki_categories').select('*')
  const { data: entries } = await supabase.from('wiki_entries').select('*')

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8">
      <WikiView categories={categories || []} entries={entries || []} />
    </div>
  )
}