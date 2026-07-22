import { createClient } from '@/lib/supabase/server'
import { QMView } from './QMView'

const OHT_CHECKLIST = {
  id: 'oht-checklist',
  title: 'Ozon-Hochdosis-Therapie (OHT)',
  description: 'Standardarbeitsanweisung (SOP) für die Ozon-Hochdosis-Therapie. Beinhaltet die schrittweise Patientenvorbereitung, Geräteeinstellung, Durchführung und Nachsorge.',
  icon: 'activity',
  isProtocol: true,
  category: 'Therapie-SOP',
  checklist_items: [],
  protocol_steps: [
    {
      step: 1,
      title: 'Patientenvorbereitung',
      details: 'Unterschrift auf Aufklärungsformular kontrollieren & initiale Blutdruckmessung (RR) durchführen',
      badge: 'Vorbereitung',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300'
    },
    {
      step: 2,
      title: 'Materialbedarf bereitstellen',
      details: 'Flexüle, Handschuhe, Desinfektionsmittel, Stauschlauch, Medozon i-Set, Heparin (1,2 ml) inkl. Spritze & RR-Messgerät',
      badge: 'Material',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300'
    },
    {
      step: 3,
      title: 'Gerätevorbereitung',
      details: 'OHT-Gerät (Hyper Medozon comfort) einschalten & Ozon-Flasche am Ventil öffnen',
      badge: 'Gerät',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
    },
    {
      step: 4,
      title: 'Medozon i-Set vorbereiten',
      details: 'i-Set steril öffnen und den unteren Schlauch sofort schließen',
      badge: 'Sterilgut',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300'
    },
    {
      step: 5,
      title: 'Heparin aufziehen',
      details: '1,2 ml Heparin aufziehen, langsam in das Oval (Tropfkammer) spritzen & Oval in die Halterung am Gerät einhängen',
      subItems: [
        { label: 'Dosierung', text: '1,2 ml Heparin in Tropfkammer' }
      ],
      badge: 'Medikation',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300'
    },
    {
      step: 6,
      title: 'Schlauchverbindungen',
      details: 'Unteren Schlauch für Patienten griffbereit halten. Oberen Schlauch auf mittigen Zugang am Gerät (Infusion) schrauben',
      badge: 'Aufbau',
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300'
    },
    {
      step: 7,
      title: 'Geräteeinstellung',
      details: 'Am Touch-Display „Infusion“ wählen, Ozon-Konzentration auf 80 µg/ml einstellen & mit „OK“ (3. Knopf rechts) bestätigen',
      subItems: [
        { label: 'Einstellung', text: 'Ozon-Konzentration: 80 µg/ml' }
      ],
      badge: 'Parameter',
      badgeColor: 'bg-teal-100 text-teal-900 border-teal-300'
    },
    {
      step: 8,
      title: 'Anschluss an den Patienten',
      details: 'Stauschlauch anlegen (geschlossen lassen), Flexüle beim Patienten legen & unteren (geschlossenen) Schlauch des Medozon-Sets anschließen',
      badge: 'Patient',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300'
    },
    {
      step: 9,
      title: 'Verbindungen & Sicherung',
      details: 'Schutzkappe abziehen, Schlauchsystem sicher mit Flexüle verbinden, Radklemme am Schlauchsystem öffnen & grünen Schalter (oben am Gerät) betätigen',
      badge: 'Sicherheit',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300'
    },
    {
      step: 10,
      title: 'Schlauch fixieren',
      details: 'Den Schlauch mit Fixierpflaster leicht am Arm des Patienten ankleben, um ein versehentliches Hängenbleiben zu verhindern',
      badge: 'Fixierung',
      badgeColor: 'bg-zinc-100 text-zinc-900 border-zinc-300'
    },
    {
      step: 11,
      title: 'Luftfalle aktivieren',
      details: 'Blutschlauch in oberen Sensor legen, in das Quetschventil einlegen & die silberne Taste an der Luftfalle drücken',
      badge: 'Sensorik',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300'
    },
    {
      step: 12,
      title: 'Therapiestart & Überwachung',
      details: 'Sobald Signalton ertönt, Stauschlauch beim Patienten sofort öffnen. Infusion starten. WICHTIG: Personal bleibt zwingend am Patienten, Blutdruck regelmäßig messen und lückenlos dokumentieren! (5 automatische Zyklen)',
      subItems: [
        { label: 'Zyklen', text: '5 automatische Zyklen' },
        { label: 'Pflicht', text: 'Personal bleibt zwingend am Patienten' }
      ],
      badge: 'Therapie & RR',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300'
    },
    {
      step: 13,
      title: 'Nachsorge',
      details: 'Nach regulärem Ende des 5. Zyklus eine Wartezeit von 10 Minuten einhalten',
      subItems: [
        { label: 'Wartezeit', text: '10 Minuten Nachbeobachtung' }
      ],
      badge: 'Ruhephase',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
    },
    {
      step: 14,
      title: 'Begleittherapie (Vitamin C)',
      details: 'Im Anschluss eine Vitamin C Infusion (7,5 mg gelöst in 250 ml NaCl) verabreichen',
      subItems: [
        { label: 'Begleit-Infusion', text: 'Vitamin C 7,5 mg in 250 ml NaCl' }
      ],
      badge: 'Abschluss-Infusion',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300'
    }
  ]
}

const CHELATIERUNG_PROTOCOL = {
  id: 'ausleitung-chelatierung',
  title: 'Ausleitung / Chelatierung',
  description: 'Standardschema zur Entgiftung & Schwermetall-Ausleitung. Inkl. Harn-pH-Messung, DMPS/DTPA/EDTA, Protokoll N & Glutathion-Bolus.',
  icon: 'flask-conical',
  isProtocol: true,
  category: 'Infusionsprotokoll',
  checklist_items: [],
  protocol_steps: [
    {
      step: 1,
      title: 'pH-Wert im Urin ermitteln',
      details: 'Voraussetzung für die Dosierung der Baseninfusion:',
      subItems: [
        { label: 'pH < 7', text: 'kleine Baseninfusion' },
        { label: 'pH < 6', text: 'große Baseninfusion' }
      ],
      badge: 'Urindiagnostik',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
    },
    {
      step: 2,
      title: 'DMPS & Chelatbildner',
      details: '1. Ampulle DMPS in 100ml NaCl UND Zink DTPA (Ü60) ODER Ca Na EDTA (U60) je nach Absprache',
      subItems: [
        { label: 'Ü60 (über 60 J.)', text: 'Zink DTPA (Ü60)' },
        { label: 'U60 (unter 60 J.)', text: 'Ca Na EDTA (U60)' }
      ],
      badge: 'Chelatierung',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300'
    },
    {
      step: 3,
      title: 'Protokoll N + Folsäure',
      details: '½ Ampulle Protokoll N (50 ml) + Folsäure in 250ml NaCl',
      subItems: [
        { label: 'Ersatzmittel', text: '3x ATP Konzentrat' }
      ],
      badge: 'Infusion',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300'
    },
    {
      step: 4,
      title: 'Glutathion-Bolus',
      details: 'Während der Einlaufzeit von Protokoll N:',
      subItems: [
        { label: 'Bolus-Gabe', text: '1 Ampulle 600mg Glutathion als Bolus verabreichen' }
      ],
      badge: 'Bolus-Injektion',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300'
    }
  ]
}

const AUFBAU_INFUSION_PROTOCOL = {
  id: 'aufbau-infusion',
  title: 'Aufbau Infusion',
  description: 'Vitalisierungs- & Regenerations-Schema. Inkl. Vitamin C, L-Carnitin, ATP-Konzentrat, Glutathion-Doppelbolus & Mineralien.',
  icon: 'sun',
  isProtocol: true,
  category: 'Infusionsprotokoll',
  checklist_items: [],
  protocol_steps: [
    {
      step: 1,
      title: 'Vitamin C & L-Carnitin Infusion',
      details: 'Vorlauf-Infusion zur Zellregenerierung:',
      subItems: [
        { label: 'Rezeptur', text: 'Vitamin C 7,5 g + 1 Ampulle L-Carnitin in 100ml NaCl' }
      ],
      badge: 'Infusion 1',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300'
    },
    {
      step: 2,
      title: 'ATP-Konzentrat Infusion',
      details: 'Mitochondrien-Energiekomplex:',
      subItems: [
        { label: 'Rezeptur', text: '3x Ampullen ATP-Konzentrat in 250ml NaCl' }
      ],
      badge: 'Infusion 2',
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300'
    },
    {
      step: 3,
      title: 'Glutathion Doppel-Bolus',
      details: 'Parallel während der ATP-Konzentrat-Infusion:',
      subItems: [
        { label: 'Bolus-Gabe', text: '2 Ampullen 600mg Glutathion als Bolus verabreichen (= 1.200 mg Glutathion)' }
      ],
      badge: 'Bolus-Injektion',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300'
    },
    {
      step: 4,
      title: 'Mineralien Infusion',
      details: 'Abschließende Mikronährstoff-Versorgung:',
      subItems: [
        { label: 'Rezeptur', text: '1 Ampulle Selenase + 1 Ampulle Magnesium (500mg) + 1 Ampulle Unizink in 100 ml NaCl' }
      ],
      badge: 'Infusion 3',
      badgeColor: 'bg-teal-100 text-teal-900 border-teal-300'
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

  // Zusammenführen von OHT Checkliste, Infusions-Protokollen und Supabase Checklisten
  const allChecklists = [OHT_CHECKLIST, CHELATIERUNG_PROTOCOL, AUFBAU_INFUSION_PROTOCOL, ...formattedChecklists]

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8">
      <QMView initialChecklists={allChecklists} />
    </div>
  )
}