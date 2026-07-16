import { createClient } from '@/lib/supabase/server'
import { QMView } from './QMView'

const OHT_CHECKLIST = {
  id: 'oht-checklist',
  title: 'Ozon-Hochdosis-Therapie (OHT)',
  description: 'Standardarbeitsanweisung (SOP) für die Ozon-Hochdosis-Therapie. Beinhaltet die schrittweise Patientenvorbereitung, Geräteeinstellung, Durchführung und Nachsorge.',
  icon: 'activity',
  checklist_items: [
    {
      id: 'oht-item-1',
      task_text: 'Patientenvorbereitung: Unterschrift auf Aufklärungsformular kontrollieren & initiale Blutdruckmessung (RR) durchführen',
      sort_order: 1
    },
    {
      id: 'oht-item-2',
      task_text: 'Materialbedarf bereitstellen: Flexüle, Handschuhe, Desinfektionsmittel, Stauschlauch, Medozon i-Set, Heparin (1,2 ml) inkl. Spritze & RR-Messgerät',
      sort_order: 2
    },
    {
      id: 'oht-item-3',
      task_text: 'Gerätevorbereitung: OHT-Gerät (Hyper Medozon comfort) einschalten & Ozon-Flasche am Ventil öffnen',
      sort_order: 3
    },
    {
      id: 'oht-item-4',
      task_text: 'Medozon i-Set vorbereiten: i-Set steril öffnen und den unteren Schlauch sofort schließen',
      sort_order: 4
    },
    {
      id: 'oht-item-5',
      task_text: 'Heparin aufziehen: 1,2 ml Heparin aufziehen, langsam in das Oval (Tropfkammer) spritzen & Oval in die Halterung am Gerät einhängen',
      sort_order: 5
    },
    {
      id: 'oht-item-6',
      task_text: 'Schlauchverbindungen: Unteren Schlauch für Patienten griffbereit halten. Oberen Schlauch auf mittigen Zugang am Gerät (Infusion) schrauben',
      sort_order: 6
    },
    {
      id: 'oht-item-7',
      task_text: 'Geräteeinstellung: Am Touch-Display „Infusion“ wählen, Ozon-Konzentration auf 80 µg/ml einstellen & mit „OK“ (3. Knopf rechts) bestätigen',
      sort_order: 7
    },
    {
      id: 'oht-item-8',
      task_text: 'Anschluss an den Patienten: Stauschlauch anlegen (geschlossen lassen), Flexüle beim Patienten legen & unteren (geschlossenen) Schlauch des Medozon-Sets anschließen',
      sort_order: 8
    },
    {
      id: 'oht-item-9',
      task_text: 'Verbindungen & Sicherung: Schutzkappe abziehen, Schlauchsystem sicher mit Flexüle verbinden, Radklemme am Schlauchsystem öffnen & grünen Schalter (oben am Gerät) betätigen',
      sort_order: 9
    },
    {
      id: 'oht-item-10',
      task_text: 'Schlauch fixieren: Den Schlauch mit Fixierpflaster leicht am Arm des Patienten ankleben, um ein versehentliches Hängenbleiben zu verhindern',
      sort_order: 10
    },
    {
      id: 'oht-item-11',
      task_text: 'Luftfalle aktivieren: Blutschlauch in oberen Sensor legen, in das Quetschventil einlegen & die silberne Taste an der Luftfalle drücken',
      sort_order: 11
    },
    {
      id: 'oht-item-12',
      task_text: 'Therapiestart & Überwachung: Sobald Signalton ertönt, Stauschlauch beim Patienten sofort öffnen. Infusion starten. WICHTIG: Personal bleibt zwingend am Patienten, Blutdruck regelmäßig messen und lückenlos dokumentieren! (5 automatische Zyklen)',
      sort_order: 12
    },
    {
      id: 'oht-item-13',
      task_text: 'Nachsorge: Nach regulärem Ende des 5. Zyklus eine Wartezeit von 10 Minuten einhalten',
      sort_order: 13
    },
    {
      id: 'oht-item-14',
      task_text: 'Begleittherapie: Im Anschluss eine Vitamin C Infusion (7,5 mg gelöst in 250 ml NaCl) verabreichen',
      sort_order: 14
    }
  ]
}

export default async function QMPage() {
  const supabase = await createClient()

  const { data: checklists } = await supabase
    .from('checklists')
    .select(`
      id, title, description, icon,
      checklist_items ( id, task_text, sort_order, guide_images )
    `)
    .order('created_at', { ascending: true })

  const formattedChecklists = checklists?.map(list => ({
    ...list,
    checklist_items: list.checklist_items.sort((a: any, b: any) => a.sort_order - b.sort_order)
  })) || []

  // Zusammenführen von OHT Checkliste und Supabase Checklisten
  const allChecklists = [OHT_CHECKLIST, ...formattedChecklists]

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8">
      <QMView initialChecklists={allChecklists} />
    </div>
  )
}