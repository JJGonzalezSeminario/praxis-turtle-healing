const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // 1. Insert new checklist
  const { data: checklist, error: chkError } = await supabase
    .from('checklists')
    .insert([{
      title: 'Vorbereitung nächster Arbeitstag',
      description: 'Vorbereitende Aufgaben für den nächsten Arbeitstag',
      icon: 'calendar'
    }])
    .select()
    .single();

  if (chkError) {
    console.error('Error creating checklist:', chkError);
    return;
  }
  
  const checklistId = checklist.id;
  console.log('Successfully created checklist:', checklistId);

  // 2. Insert checklist items
  const items = [
    {
      checklist_id: checklistId,
      task_text: 'Befunde auf Ximenas Schreibtisch legen.',
      sort_order: 10,
      guide_images: null
    },
    {
      checklist_id: checklistId,
      task_text: 'Blutentnahmen (BEs) vorbereiten: BEs in Auftrag geben (mit dem Datum von morgen), ausdrucken und Röhrchen bekleben.',
      sort_order: 20,
      guide_images: null
    },
    {
      checklist_id: checklistId,
      task_text: 'Infusionen richten: Infusionen für den Folgetag vorbereiten (s. Bildanleitung). Hinweis: Die weiße Nierenschale ist für den Spritzenmüll.',
      sort_order: 30,
      guide_images: ['/qm-wiki-2.jpg']
    },
    {
      checklist_id: checklistId,
      task_text: 'Behandlungszimmer auffüllen: Verbrauchsmaterialien auffüllen und Zimmer ordentlich hinterlassen.',
      sort_order: 40,
      guide_images: null
    }
  ];

  const { data: insertedItems, error: itemsError } = await supabase
    .from('checklist_items')
    .insert(items)
    .select();

  if (itemsError) {
    console.error('Error creating checklist items:', itemsError);
  } else {
    console.log('Successfully created checklist items:', insertedItems.length);
  }
}

run();
