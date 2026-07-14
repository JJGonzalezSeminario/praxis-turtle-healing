const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // 1. Get the checklist ID for "Ablauf Blutentnahme"
  const { data: checklist, error: chkError } = await supabase
    .from('checklists')
    .select('id')
    .eq('title', 'Ablauf Blutentnahme')
    .single();

  if (chkError || !checklist) {
    console.error('Error finding checklist:', chkError);
    return;
  }

  // 2. Set guide_images = null for all items of this checklist
  const { data: updated, error: updateError } = await supabase
    .from('checklist_items')
    .update({ guide_images: null })
    .eq('checklist_id', checklist.id)
    .select();

  if (updateError) {
    console.error('Error updating checklist items:', updateError);
  } else {
    console.log('Successfully removed guide images from checklist items:', updated.length);
  }

  // 3. Remove the image file from public/qm-wiki-3.jpg
  const imagePath = path.join(__dirname, '..', 'public', 'qm-wiki-3.jpg');
  if (fs.existsSync(imagePath)) {
    try {
      fs.unlinkSync(imagePath);
      console.log('Successfully deleted local file public/qm-wiki-3.jpg');
    } catch (e) {
      console.error('Error deleting local file:', e);
    }
  } else {
    console.log('Local file public/qm-wiki-3.jpg did not exist');
  }
}

run();
