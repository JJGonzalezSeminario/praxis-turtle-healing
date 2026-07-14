const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const category_id = 'bc753ba0-8079-4dfb-913e-d21a114ff656'; // QM category
  const title = 'Stuhlprobe Colo Alert Ganz Immun';
  const content = `Testset „Colo Alert“
Laboranforderung über 2D Connect -> Eigene Profile -> Mikrobiom/ ColoAlert auswählen -> COLO ALERT PLUS anklicken
Auftragsschein und 4 Klebchen ausdrucken
Stuhl Röhrchen innen und außen bekleben, ColoAlert auf entsprechendes Röhrchen, Hämoglobin auf flaches Röhrchen mit grünem Deckel kleben
dem Pat. mitgeben mit Info, die Probe Anfang der Woche direkt in der Postfiliale abzugeben

![Stuhlprobe](/qm-wiki-1.jpg)`;

  const { data, error } = await supabase
    .from('wiki_entries')
    .insert([{ category_id, title, content }])
    .select();

  if (error) {
    console.error('Error inserting entry:', error);
  } else {
    console.log('Successfully inserted entry:', data);
  }
}

run();
