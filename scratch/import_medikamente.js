const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MEDIKAMENTE = [
  // === Arnika-Apotheke ===
  { name: 'Amino-Vital Infusion 3x100ml', pzn: '8079780', einheit: '3X100 ml', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'Vitamin C 7,5g 50x20ml', pzn: '8095916', einheit: '50X20 ml', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'Vitamin C 7,5g 5x20ml', pzn: '8084551', einheit: '5x20 ml', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'Vitamin C 7,5g 10x20ml', pzn: '8096838', einheit: '10x20ml', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'ATP-Konzentrat', pzn: '8087207', einheit: '10 x 5 ml', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'IZ Intrafix Primeline Classic', pzn: '8021757', einheit: null, category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'Aminoinfusion Anti Stress', pzn: '8084999', einheit: '6 ST', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'Aminoinfusion Immun', pzn: '8085154', einheit: '4 ST', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'Aminoinfusion Onko V2 mit Elektrolyt-Lösung', pzn: '8095796', einheit: '5 ST', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'L-Lysin 2g Kurzinfusion 5x20ml', pzn: '8084746', einheit: '5x20ml', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'Alpha-Liponsäure 600mg Kurzinfusion', pzn: '8084976', einheit: '5x20 ml', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'AOCT', pzn: '8084864', einheit: '5x20 ml', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'Prolin-Lysin', pzn: '8084829', einheit: '5X20 ml', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'L-Carnitin 1g', pzn: '8022604', einheit: '10x5 ml', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },

  // === Viktoria Apotheke ===
  { name: 'Konzentrat Aufbau N 100ml', pzn: '8293416', einheit: '100 ml', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'Glutathion 600', pzn: '8290551', einheit: '10 Ampullen', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'Curcumin 50', pzn: '8165516', einheit: null, category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'PROCAIN pharmarissano Ampulle 1% 5ml', pzn: '16816235', einheit: '50X5 ml', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'MILCHSÄURE Pflüger Injektionslösung 5ml', pzn: '1222412', einheit: '50 St', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'HEPAR COMP. Heel Ampullen', pzn: '6340636', einheit: '10 St', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'DERIVATIO H Inj. Ampullen', pzn: '4886756', einheit: '50X5 ml', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'ZINK TRINATRIUM pentetat Injektionslösung', pzn: '3361170', einheit: '5X5 ml', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'DIMAVAL 250mg DMPS-Na/5ml Injektionslösung', pzn: '1686353', einheit: '1X5 ml', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
];

async function run() {
  const records = MEDIKAMENTE.map(m => ({
    name: m.name,
    category: m.category,
    pzn: m.pzn || null,
    shop_url: m.shop_url,
    status: 'ok',
    min_stock: 1,
  }));

  console.log(`Importiere ${records.length} Medikamente...`);

  const { data, error } = await supabase
    .from('inventory')
    .insert(records)
    .select('id, name, category');

  if (error) {
    console.error('Fehler beim Import:', error.message);
    return;
  }

  console.log(`\nErfolgreich ${data.length} Artikel importiert:\n`);
  data.forEach((item, i) => console.log(`  ${i + 1}. [${item.category}] ${item.name}`));
  console.log('\nFertig!');
}

run();
