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
      title: 'Ablauf Blutentnahme',
      description: 'Vorbereitung, Dokumentation und Nachsorge bei Blutentnahmen (BE)',
      icon: 'flask-conical'
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
      task_text: 'Vorbereitung am Vorabend: Die Blutentnahme (BE) bereits am Abend vorher vorbereiten.',
      sort_order: 10,
      guide_images: ['/qm-wiki-3.jpg']
    },
    {
      checklist_id: checklistId,
      task_text: 'Dokumentation in Akte: Eintrag in der elektronischen Patientenakte unter Übersicht / CAVE sowie unter Befunde vornehmen.',
      sort_order: 20,
      guide_images: null
    },
    {
      checklist_id: checklistId,
      task_text: 'Laborauftrag erstellen: BE für Ganzimmun (GI) und/oder IMD anfordern (gerne auch die einzelnen Parameter erfassen).',
      sort_order: 30,
      guide_images: null
    },
    {
      checklist_id: checklistId,
      task_text: 'Laborbuch befüllen: Eintrag ins Laborbuch vornehmen (bei IMD-Proben zusätzlich den Barcode-Aufkleber aufbringen).',
      sort_order: 40,
      guide_images: null
    },
    {
      checklist_id: checklistId,
      task_text: 'Episode eintragen: In der Patientenakte die entsprechende Episode als BE kennzeichnen.',
      sort_order: 50,
      guide_images: null
    },
    {
      checklist_id: checklistId,
      task_text: 'Folgetermin vereinbaren: Direkt einen Termin zur Befundbesprechung in 2 bis 3 Wochen ausmachen.',
      sort_order: 60,
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
