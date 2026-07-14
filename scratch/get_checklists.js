const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: checklists, error } = await supabase
    .from('checklists')
    .select(`
      id, title, description, icon,
      checklist_items ( id, task_text, sort_order, guide_images )
    `);

  console.log('Checklists:', JSON.stringify(checklists, null, 2), error);
}

run();
