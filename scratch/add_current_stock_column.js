const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // Test if current_stock column already exists
  const { error: testError } = await supabase
    .from('inventory')
    .select('current_stock')
    .limit(1);

  if (!testError) {
    console.log('✅ Spalte current_stock existiert bereits – keine Migration nötig.');
    return;
  }

  console.log('⚠️  Spalte current_stock fehlt. Bitte führe folgendes SQL im Supabase Dashboard aus:');
  console.log('');
  console.log('  ALTER TABLE inventory ADD COLUMN IF NOT EXISTS current_stock integer NOT NULL DEFAULT 0;');
  console.log('');
  console.log('Danach dieses Skript nochmal ausführen um zu bestätigen.');
}

run();
