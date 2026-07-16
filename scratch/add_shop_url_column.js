const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // Test if shop_url column already exists
  const { error: testError } = await supabase
    .from('inventory')
    .select('shop_url')
    .limit(1);

  if (!testError) {
    console.log('Spalte shop_url existiert bereits – kein Import nötig.');
    return;
  }

  console.log('Spalte shop_url fehlt. Bitte führe folgendes SQL im Supabase Dashboard aus:');
  console.log('');
  console.log('  ALTER TABLE inventory ADD COLUMN IF NOT EXISTS shop_url text;');
  console.log('');
  console.log('Danach dieses Skript nochmal ausführen und dann import_medikamente.js starten.');
}

run();
