const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MEDIKAMENTE = [
  // === Arnika-Apotheke === (14 Artikel)
  { name: 'Amino-Vital Infusion 3x100ml', pzn: '8079780', einheit: '3X100 ml', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'Vitamin C 7,5g 50x20ml', pzn: '8095916', einheit: '50X20 ml', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'Vitamin C 7,5g 5x20ml', pzn: '8084551', einheit: '5x20 ml', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'Vitamin C 7,5g 10x20ml', pzn: '8096838', einheit: '10x20ml', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'ATP-Konzentrat', pzn: '8087207', einheit: '10 x 5 ml', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'IZ Intrafix Primeline Classic', pzn: '8021757', einheit: null, category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'Aminoinfusion Anti Stress', pzn: '8084999', einheit: '6 ST', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'Aminoinfusion Immun', pzn: '8085154', einheit: '4 ST', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'Aminoinfusion Onko V2 mit Elektrolyt-Lösung', pzn: '8095796', einheit: '5 ST', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'L-Lysin 2g Kurzinfusion 5x20ml', pzn: '8084746', einheit: '5x20m', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'Alpha-Liponsäure 600mg Kurzinfusion', pzn: '8084976', einheit: '5x20 ml', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'AOCT', pzn: '8084864', einheit: '5x20 ml', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'Prolin-Lysin', pzn: '8084829', einheit: '5X20 ml', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },
  { name: 'L-Carnitin 1g', pzn: '8022604', einheit: '10x5 ml', category: 'Medikamente – Arnika', shop_url: 'https://www.arnika-apo.de' },

  // === Viktoria Apotheke === (18 Artikel)
  { name: 'Konzentrat Aufbau N', pzn: '8293416', einheit: '100 ml', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'Glutathion 600', pzn: '8290551', einheit: '10 Ampullen', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'Curcumin 50', pzn: '8165516', einheit: null, category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'PROCAIN pharmarissano Ampulle 1% 5 ml', pzn: '16816235', einheit: '50X5 ml', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'MILCHSÄURE Pflüger Injektionslösung 5 ml', pzn: '1222412', einheit: '50 St', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'HEPAR COMP. Heel Ampullen', pzn: '6340636', einheit: '10 St', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'DERIVATIO H Inj. Ampullen', pzn: '4886756', einheit: '50X5 ml', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'ZINK TRINATRIUM pentetat Injektionslösung Amp.', pzn: '3361170', einheit: '5X5 ml', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'DIMAVAL 250 mg DMPS-Na/5ml Injektionslösung Amp.', pzn: '1686353', einheit: '1X5 ml', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'SELENASE 100 μg pro injectione Ampullen', pzn: '593721', einheit: '50X2 ml', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'NERVOREGIN comp. H Pflüger Ampullen', pzn: '3679601', einheit: '50 St', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'ZEEL comp. N Ampullen', pzn: '277836', einheit: '10 St', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'MAGNEROT 500 Injekt Ampullen', pzn: '2606899', einheit: '10 St', category: 'Medikamente – Shop Apotheke', shop_url: 'https://www.shop-apotheke.com/' },
  { name: 'STEROFUNDIN ISO Ecoflac Plus Infusionslösung', pzn: '1078949', einheit: '10X250 ml', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'UNIZINK Injektionslösung in Ampullen', pzn: '3499388', einheit: '5X10 ml', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'ADRENALIN Ethypharm 1 mg/ml 1:1000 Injektionslsg.', pzn: '16033102', einheit: '10X1 ml', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'HEPARIN NATRIUM Braun 25.000 I.E./5ml Inj./Inf.-L.', pzn: '15782698', einheit: '10X5 ml', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'KOMBISTOPFEN steril rot', pzn: '7373520', einheit: '1 St', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'TRANSOFIX Transfer-Set', pzn: '19149963', einheit: '100 St', category: 'Medikamente – Viktoria', shop_url: 'https://shop.internet-apotheke.de/' },
  { name: 'Lymphomyosot® N Ampullen', pzn: '1674686', einheit: '10 St', category: 'Medikamente – Shop Apotheke', shop_url: 'https://www.shop-apotheke.com/' },

  // === Shop Apotheke === (14 Artikel)
  { name: 'Unizink®', pzn: '3499394', einheit: '25x10 ml | Ampullen', category: 'Medikamente – Shop Apotheke', shop_url: 'https://www.shop-apotheke.com/' },
  { name: 'Magnerot® 1.000 Injekt', pzn: '2606942', einheit: '10x10 ml', category: 'Medikamente – Shop Apotheke', shop_url: 'https://www.shop-apotheke.com/' },
  { name: 'Ferrinject 50 mg Eisen', pzn: '18841094', einheit: '5x2 ml', category: 'Medikamente – Shop Apotheke', shop_url: 'https://www.shop-apotheke.com/' },
  { name: 'toxiLoges® Injektionslösung', pzn: '13704027', einheit: '10X2 ml', category: 'Medikamente – Shop Apotheke', shop_url: 'https://www.shop-apotheke.com/' },
  { name: 'Mucosa compositum Ampullen', pzn: '4313575', einheit: '10 St', category: 'Medikamente – Shop Apotheke', shop_url: 'https://www.shop-apotheke.com/' },
  { name: 'Zeel® comp. N', pzn: '277836', einheit: '10 St', category: 'Medikamente – Shop Apotheke', shop_url: 'https://www.shop-apotheke.com/' },
  { name: 'Nervoregin® comp. H Pflüger', pzn: '3678665', einheit: '10 St', category: 'Medikamente – Shop Apotheke', shop_url: 'https://www.shop-apotheke.com/' },
  { name: 'dystoLoges® Injekt.', pzn: '13699674', einheit: '10X2 ml', category: 'Medikamente – Shop Apotheke', shop_url: 'https://www.shop-apotheke.com/' },
  { name: 'Milchsäure Pflüger® Inj. 5 ml', pzn: '1222429', einheit: '10 St', category: 'Medikamente – Shop Apotheke', shop_url: 'https://www.shop-apotheke.com/' },
  { name: 'Vitamin B 12 forte-Hevert injekt Ampullen', pzn: '4836089', einheit: '10X2 ml', category: 'Medikamente – Shop Apotheke', shop_url: 'https://www.shop-apotheke.com/' },
  { name: 'VITAMIN B6-HEVERT® Ampullen', pzn: '3919991', einheit: '10X2 ml', category: 'Medikamente – Shop Apotheke', shop_url: 'https://www.shop-apotheke.com/' },
  { name: 'Vitamin B1-Injektopas® 100 mg', pzn: '3262456', einheit: '10X2 ml', category: 'Medikamente – Shop Apotheke', shop_url: 'https://www.shop-apotheke.com/' },
  { name: 'Neralgo-Rhem-Injeel® Ampullen', pzn: '3679096', einheit: '10 St', category: 'Medikamente – Shop Apotheke', shop_url: 'https://www.shop-apotheke.com/' },
  { name: 'Aqua Ad Inject Miniplasco connect Ampullen', pzn: '3113087', einheit: '20X10 ml', category: 'Medikamente – Shop Apotheke', shop_url: 'https://www.shop-apotheke.com/' },
];

async function run() {
  const records = MEDIKAMENTE.map(m => ({
    name: m.name.trim(),
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
