const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: entries, error: entError } = await supabase.from('wiki_entries').select('*');
  console.log('Entries:', JSON.stringify(entries, null, 2), entError);
}

run();
