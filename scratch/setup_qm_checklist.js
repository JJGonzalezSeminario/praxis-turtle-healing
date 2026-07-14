const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // 1. Delete old wiki entry
  const { data: delData, error: delError } = await supabase
    .from('wiki_entries')
    .delete()
    .eq('title', 'Stuhlprobe Colo Alert Ganz Immun');
  
  if (delError) {
    console.error('Error deleting wiki entry:', delError);
  } else {
    console.log('Successfully deleted old wiki entry');
  }

  // 2. Insert new checklist
  const { data: checklist, error: chkError } = await supabase
    .from('checklists')
    .insert([{
      title: 'Stuhlprobe Colo Alert (Ganzimmun)',
      description: 'Ablauf zur Vorbereitung und Ausgabe des Testsets',
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

  // 3. Insert checklist items
  const items = [
    {
      checklist_id: checklistId,
      task_text: 'Testset „Colo Alert“ bereitlegen und auf Vollständigkeit prüfen.',
      sort_order: 10,
      guide_images: ['/qm-wiki-1.jpg']
    },
    {
      checklist_id: checklistId,
      task_text: 'Laboranforderung über 2D Connect ausfüllen: Eigene Profile → Mikrobiom/ColoAlert auswählen → COLO ALERT PLUS anklicken.',
      sort_order: 20,
      guide_images: null
    },
    {
      checklist_id: checklistId,
      task_text: 'Auftragsschein und 4 Barcode-Klebchen ausdrucken.',
      sort_order: 30,
      guide_images: null
    },
    {
      checklist_id: checklistId,
      task_text: 'Stuhl-Röhrchen innen und außen bekleben: „ColoAlert“-Etikett auf das entsprechende Röhrchen und „Hämoglobin“-Etikett auf das flache Röhrchen mit dem grünen Deckel kleben.',
      sort_order: 40,
      guide_images: null
    },
    {
      checklist_id: checklistId,
      task_text: 'Dem Patienten das Set mitgeben und informieren, die Probe Anfang der Woche direkt in der Postfiliale abzugeben.',
      sort_order: 50,
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
