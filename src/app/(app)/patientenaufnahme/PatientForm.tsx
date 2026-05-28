'use client'

import { useState, useRef, useEffect } from 'react'
import { UserPlus, Activity, Shield, Save, RotateCcw, ChevronRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { jsPDF } from 'jspdf'
import { createClient } from '@/lib/supabase/client' // <-- Supabase Client Importiert

export function PatientForm() {
  const supabase = createClient() // <-- Supabase initialisiert
  const [step, setStep] = useState(1)
  const [isSuccess, setIsSuccess] = useState(false) 
  
  const [formData, setFormData] = useState({
    name: '', birthDate: '', address: '', phone: '', email: '', 
    insurance: 'Gesetzlich versichert', weight: '', height: '',
    preconditions: '', medication: '', allergies: '',
    location: 'Berlin', 
    signatureDate: new Date().toISOString().split('T')[0]
  })

  const [consentInfusion, setConsentInfusion] = useState(false)
  const [consentBlood, setConsentBlood] = useState(false)
  const [transmitData, setTransmitData] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    if (step === 3 && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'
      }
    }
  }, [step])

  const startDrawing = (e: any) => {
    if (!canvasRef.current) return
    setIsDrawing(true)
    const rect = canvasRef.current.getBoundingClientRect()
    const ctx = canvasRef.current.getContext('2d')
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    ctx?.beginPath()
    ctx?.moveTo(clientX - rect.left, clientY - rect.top)
  }

  const draw = (e: any) => {
    if (!isDrawing || !canvasRef.current) return
    e.preventDefault()
    const rect = canvasRef.current.getBoundingClientRect()
    const ctx = canvasRef.current.getContext('2d')
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    ctx?.lineTo(clientX - rect.left, clientY - rect.top)
    ctx?.stroke()
  }

  const clearCanvas = () => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
  }

  const handleNext = () => {
    if (step === 1 && (!formData.name || !formData.birthDate || !formData.address || !formData.phone)) {
      alert('Bitte füllen Sie alle Pflichtfelder aus (Name, Geburtsdatum, Anschrift und Telefonnummer).')
      return
    }
    setStep(step + 1)
  }

  const handleSaveAndSend = async () => {
    if (transmitData === null) {
      alert('Bitte wählen Sie aus, ob Daten per Mail/Fax übermittelt werden dürfen.')
      return
    }
    if (!canvasRef.current) return

    const doc = new jsPDF()
    const today = new Date().toLocaleDateString('de-DE')

    // Seite 1: Anamnese
    doc.setFontSize(22)
    doc.setTextColor(15, 81, 86)
    doc.text('Patientenaufnahme & Anamnese', 20, 25)
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    doc.text(`Praxis Turtle-Healing | Erfasst am: ${today}`, 20, 33)
    doc.line(20, 36, 190, 36)
    
    doc.setFontSize(11)
    doc.setTextColor(40, 40, 40)
    let y = 48
    const gap = 10

    let formattedBirth = formData.birthDate.split('-').reverse().join('-')

    doc.text(`Name: ${formData.name}`, 20, y); y += gap
    doc.text(`Geburtsdatum: ${formattedBirth}`, 20, y); y += gap
    doc.text(`Adresse: ${formData.address}`, 20, y); y += gap
    doc.text(`Telefon: ${formData.phone}`, 20, y); y += gap
    doc.text(`E-Mail: ${formData.email}`, 20, y); y += gap
    doc.text(`Versicherung: ${formData.insurance}`, 20, y); y += gap
    doc.text(`Größe: ${formData.height ? formData.height + ' cm' : 'Keine Angabe'}`, 20, y); y += gap
    doc.text(`Gewicht: ${formData.weight ? formData.weight + ' kg' : 'Keine Angabe'}`, 20, y); y += 12

    doc.setFont('helvetica', 'bold')
    doc.text('Medizinische Daten:', 20, y); doc.setFont('helvetica', 'normal'); y += gap
    
    doc.text('Vorerkrankungen:', 20, y); doc.setFontSize(9)
    const precondLines = doc.splitTextToSize(formData.preconditions || 'Keine Angabe', 170)
    doc.text(precondLines, 20, y + 5); y += 5 + (precondLines.length * 5) + 5

    doc.setFontSize(11)
    doc.text('Medikamente:', 20, y); doc.setFontSize(9)
    const medLines = doc.splitTextToSize(formData.medication || 'Keine Angabe', 170)
    doc.text(medLines, 20, y + 5); y += 5 + (medLines.length * 5) + 5

    doc.setFontSize(11)
    doc.text('Allergien / Unverträglichkeiten:', 20, y); doc.setFontSize(9)
    const allgLines = doc.splitTextToSize(formData.allergies || 'Keine Angabe', 170)
    doc.text(allgLines, 20, y + 5)

    // Seite 2: Aufklärung
    doc.addPage()
    doc.setFontSize(22)
    doc.setTextColor(15, 81, 86)
    doc.text('Patientenaufklärung', 20, 25)
    doc.line(20, 30, 190, 30)
    
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    let yPos = 40

    const addText = (text: string, isBold = false) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal')
      const lines = doc.splitTextToSize(text, 170)
      
      for (let i = 0; i < lines.length; i++) {
        if (yPos > 275) {
          doc.addPage()
          yPos = 20
        }
        doc.text(lines[i], 20, yPos)
        yPos += 5
      }
      yPos += 4
    }

    addText('Patientenaufklärung zur Infusionstherapie und Blutentnahme', true)
    addText('Sehr geehrte Patientin, sehr geehrter Patient,\nim Rahmen Ihrer Behandlung ist eine Infusionstherapie und/oder eine Blutentnahme notwendig. Mit dieser Information möchten wir Sie über den Ablauf und mögliche Begleiterscheinungen aufklären.')
    addText('Infusionstherapie', true)
    addText('Bei einer Infusionstherapie werden Ihnen Flüssigkeiten, Medikamente oder Nährstoffe über eine Vene direkt in den Blutkreislauf verabreicht. Dazu wird meist eine Vene am Unterarm oder an der Hand punktiert, in die ein kleiner Plastikschlauch (Venenverweilkanüle) eingeführt wird.')
    addText('Mögliche Begleiterscheinungen (Infusion):', true)
    addText('- Blaue Flecken (Hämatome): An der Punktionsstelle kann es zu einem Bluterguss kommen. Dies ist meist harmlos und bildet sich von selbst wieder zurück.\n- Paravasat (Infusion läuft ins Gewebe): In seltenen Fällen kann die Infusion danebenlaufen und ins umliegende Gewebe statt in die Vene gelangen. Dies kann zu Schwellung, Rötung, Schmerzen oder in seltenen Fällen Gewebeschäden führen. Bitte melden Sie sich sofort, wenn Sie während der Infusion Schmerzen, Brennen oder ein Spannungsgefühl verspüren.')
    addText('Blutentnahme', true)
    addText('Bei einer Blutentnahme wird Ihnen mit einer Nadel Blut aus einer Vene (meist am Arm) entnommen. Dies dient diagnostischen Zwecken und ist ein Routineverfahren.')
    addText('Mögliche Begleiterscheinungen (Blutentnahme):', true)
    addText('- Blaue Flecken (Hämatome): Auch hier kann es an der Einstichstelle zu einem Bluterguss kommen, insbesondere wenn die Vene tiefer liegt oder empfindlich ist.\n- Schwellung oder leichte Schmerzen: Diese klingen in der Regel rasch wieder ab. Eine kurzzeitige Schonung des Arms kann hilfreich sein.')
    addText('Was Sie beachten sollten:', true)
    addText('- Halten Sie die Punktionsstelle nach der Blutentnahme oder dem Entfernen der Infusion etwa 2-3 Minuten gut gedrückt, um Blutergüsse zu vermeiden.\n- Melden Sie sich bitte beim Pflegepersonal oder bei den behandelnden Ärzt*innen, wenn Sie ungewöhnliche Schmerzen, starke Schwellungen, Taubheitsgefühle oder andere Beschwerden bemerken.')
    addText('Abschließende Hinweise:', true)
    addText('Die Verfahren sind in der Regel sicher und werden täglich vielfach durchgeführt. Dennoch ist es wichtig, dass Sie über mögliche Begleiterscheinungen Bescheid wissen, damit im Fall von Beschwerden schnell reagiert werden kann.')
    
    yPos += 5
    addText('Einwilligungen des Patienten:', true)
    addText(consentInfusion ? '[ X ] Ich habe die Aufklärung gelesen und willige der Infusionstherapie ein.' : '[   ] Ich habe die Aufklärung gelesen und willige der Infusionstherapie ein.')
    addText(consentBlood ? '[ X ] Ich habe die Aufklärung gelesen und willige der Blutentnahme ein.' : '[   ] Ich habe die Aufklärung gelesen und willige der Blutentnahme ein.')

    // Seite 3: Datenschutz & Unterschrift
    doc.addPage()
    doc.setFontSize(22)
    doc.setTextColor(15, 81, 86)
    doc.text('Datenschutz & Unterschrift', 20, 25)
    doc.line(20, 30, 190, 30)

    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    
    yPos = 40

    addText('Patienteninformation zum Datenschutz', true)
    addText('Die Datenverarbeitung erfolgt aufgrund gesetzlicher Vorgaben, um den Behandlungsvertrag zwischen Ihnen und unserer Praxis und die damit verbundenen Pflichten zu erfüllen. Hierzu verarbeiten wir Ihre personenbezogenen Daten, insbesondere Ihre Gesundheitsdaten. Dazu zählen Anamnesen, Diagnosen, Therapievorschläge, Laboraufträge und Befunde, die wir oder andere Ärzte erheben. Zu diesen Zwecken können uns auch andere Ärzte oder Psychotherapeuten und Physiotherapeuten, bei denen Sie in Behandlung sind, Daten zur Verfügung stellen (z.B. in Arztbriefen). Die Erhebung von Gesundheitsdaten ist Voraussetzung für Ihre Behandlung. Werden die notwendigen Informationen nicht bereitgestellt, kann eine sorgfältige Behandlung nicht erfolgen.')
    addText('Empfänger Ihrer Daten', true)
    addText('Wir übermitteln Ihre personenbezogenen Daten nur dann an Dritte, wenn dies gesetzlich erlaubt ist oder Sie eingewilligt haben. Empfänger Ihrer personenbezogenen Daten können vor allem andere Ärzte / Psychotherapeuten / Physiotherapeuten, Krankenkassen, der Medizinische Dienst der Krankenversicherung, Labore, Ärztekammern und privatärztliche Verrechnungsstellen sein. Die Übermittlung erfolgt überwiegend zum Zwecke der Abrechnung der bei Ihnen erbrachten Leistungen, zur Klärung von medizinischen und sich aus Ihrem Versicherungsverhältnis ergebenden Questions. Im Einzelfall erfolgt die Übermittlung von Daten an weitere berechtigte Empfänger.')
    addText('Speicherung Ihrer Daten', true)
    addText('Wir bewahren Ihre personenbezogenen Daten nur solange auf, wie dies zur Durchführung der Behandlung erforderlich ist. Aufgrund rechtlicher Vorgaben sind wir dazu verpflichtet, diese Daten mindestens 10 Jahre nach Abschluss der Behandlung aufzubewahren.')
    addText('Ihre Rechte', true)
    addText('Sie haben das Recht, über die Sie betreffenden personenbezogenen Daten Auskunft zu erhalten. Auch können Sie die Berichtigung unrichtiger Daten verlangen. Darüber hinaus steht Ihnen unter bestimmten Voraussetzungen das Recht auf Löschung von Daten, das Recht auf Einschränkung der Datenverarbeitung sowie das Recht auf Datenübertragbarkeit zu. Die Verarbeitung Ihrer Daten erfolgt auf Basis von gesetzlichen Regelungen. Nur in Ausnahmefällen benötigen wir Ihr Einverständnis. In diesen Fällen haben Sie das Recht, die Einwilligung für die zukünftige Verarbeitung zu widerrufen. Sie haben ferner das Recht, sich bei der zuständigen Aufsichtsbehörde für den Datenschutz zu beschweren, wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen nicht rechtmäßig erfolgt.')
    addText('Rechtliche Grundlagen', true)
    addText('Rechtsgrundlage für die Verarbeitung Ihrer Daten is Artikel 9 Abs. 2 lit.h) DSGVO in Verbindung mit §22 Abs 1 Nr.1 lit.b) Bundesdatenschutzgesetz.')
    
    yPos += 5
    addText('Zusatz: Digitale Patientenaufnahme per Tablet', true)
    addText('Zur Optimierung unserer Praxisabläufe und im Sinne der Nachhaltigkeit nutzen wir für die Patientenaufnahme, die Anamnese sowie für medizinische Aufklärungen und Einwilligungen ein digitales Erfassungssystem (Tablet).')
    addText('1. Art und Zweck der Verarbeitung', true)
    addText('Wenn Sie Ihre Daten über unser Praxis-Tablet eingeben, erheben wir Ihre Stammdaten sowie Gesundheitsdaten. Diese Daten dienen ausschließlich der Vorbereitung und Durchführung Ihres Behandlungsvertrages, der medizinischen Diagnostik und der gesetzlichen Dokumentationspflicht. Die von Ihnen auf dem Tablet eingegebenen Daten und Ihre digitale Unterschrift werden unmittelbar in ein verschlüsseltes PDF-Dokument umgewandelt und in Ihre elektronische Patientenakte übertragen.')
    addText('2. Speicherung und Datensicherheit', true)
    addText('Ihre sensiblen Gesundheitsdaten werden auf dem Tablet nur für den Moment der Eingabe zwischengespeichert. Nach Abschluss der Eingabe oder bei Inaktivität werden die Daten lokal vom Gerät gelöscht. Die technische Bereitstellung der App-Oberfläche erfolgt über unseren IT-Dienstleister (Google Cloud EMEA Limited / Firebase). Die Server für diesen Dienst befinden sich innerhalb der Europäischen Union (Belgien), sodass ein hohes Datenschutzniveau gemäß der europäischen DSGVO gewährleistet ist. Mit dem Anbieter wurde ein entsprechender Vertrag zur Auftragsverarbeitung (AVV) gemäß Art. 28 DSGVO geschlossen. Es werden keine Gesundheitsdaten oder Anamnesebögen in der Cloud-Datenbank dieses Anbieters gespeichert.')
    
    yPos += 5
    addText('Übermittlung von Daten/Befunden per Mail/Fax an mich:', true)
    addText(transmitData === 'yes' ? '[ X ] JA     [   ] NEIN' : '[   ] JA     [ X ] NEIN')

    if (yPos > 230) { doc.addPage(); yPos = 30; }

    const sigImage = canvasRef.current.toDataURL('image/png')
    doc.addImage(sigImage, 'PNG', 20, yPos + 5, 70, 30)
    doc.line(20, yPos + 35, 90, yPos + 35)
    
    doc.setFontSize(9)
    doc.text(`Digitale Unterschrift des Patienten (${formData.name})`, 20, yPos + 40)
    doc.text(`Ort, Datum: ${formData.location}, den ${formData.signatureDate.split('-').reverse().join('.')}`, 20, yPos + 47)

    const cleanName = formData.name.replace(/[^a-zA-Z0-9]/g, '_')
    doc.save(`Aufnahme_${cleanName}.pdf`)
    
    // <-- ZÄHLER IN SUPABASE HOCHZÄHLEN
    try {
      await supabase.from('patient_intakes').insert([{}])
    } catch (err) {
      console.error("Fehler beim Hochzählen im Dashboard:", err)
    }
    
    setIsSuccess(true)
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-16 text-center animate-in zoom-in-95 duration-500 bg-white rounded-3xl shadow-xl border border-emerald-100 max-w-2xl mx-auto mt-10">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <CheckCircle2 size={48} strokeWidth={2.5} />
        </div>
        <h2 className="text-3xl font-extrabold text-zinc-900 mb-4">Vielen Dank!</h2>
        <p className="text-lg text-zinc-600 mb-10 leading-relaxed max-w-md">
          Ihre Daten wurden erfolgreich erfasst und das verschlüsselte PDF-Dokument für die Praxis generiert. Bitte geben Sie das Tablet nun an den Empfang zurück.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-10 rounded-xl shadow-lg transition text-lg w-full sm:w-auto"
        >
          Nächster Patient
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* PROGRESS BAR */}
      <div className="bg-white py-5 px-4 sm:px-8 rounded-2xl shadow-sm border border-zinc-200 mb-6">
        <div className="flex items-center justify-between w-full max-w-2xl mx-auto">
          
          {/* Step 1 */}
          <div className="flex flex-col items-center gap-2 relative z-10 w-16 sm:w-24 shrink-0">
            <div className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2",
              step >= 1 ? "bg-emerald-600 text-white border-emerald-600 shadow-md" : "bg-zinc-50 text-zinc-300 border-zinc-200"
            )}>
              <UserPlus size={20} />
            </div>
            <span className={cn("text-[10px] sm:text-[11px] font-bold text-center", step >= 1 ? "text-emerald-800" : "text-zinc-400")}>Stammdaten</span>
          </div>

          {/* Line 1-2 */}
          <div className={cn("flex-1 h-1 mx-2 sm:mx-4 rounded-full transition-colors duration-500", step >= 2 ? "bg-emerald-600" : "bg-zinc-100")} />

          {/* Step 2 */}
          <div className="flex flex-col items-center gap-2 relative z-10 w-16 sm:w-24 shrink-0">
            <div className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2",
              step >= 2 ? "bg-emerald-600 text-white border-emerald-600 shadow-md" : "bg-zinc-50 text-zinc-300 border-zinc-200"
            )}>
              <Activity size={20} />
            </div>
            <span className={cn("text-[10px] sm:text-[11px] font-bold text-center", step >= 2 ? "text-emerald-800" : "text-zinc-400")}>Aufklärung</span>
          </div>

          {/* Line 2-3 */}
          <div className={cn("flex-1 h-1 mx-2 sm:mx-4 rounded-full transition-colors duration-500", step >= 3 ? "bg-emerald-600" : "bg-zinc-100")} />

          {/* Step 3 */}
          <div className="flex flex-col items-center gap-2 relative z-10 w-16 sm:w-24 shrink-0">
            <div className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2",
              step >= 3 ? "bg-emerald-600 text-white border-emerald-600 shadow-md" : "bg-zinc-50 text-zinc-300 border-zinc-200"
            )}>
              <Shield size={20} />
            </div>
            <span className={cn("text-[10px] sm:text-[11px] font-bold text-center", step >= 3 ? "text-emerald-800" : "text-zinc-400")}>Datenschutz</span>
          </div>

        </div>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-zinc-200">
        
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-extrabold text-zinc-900 flex items-center gap-2">
              <UserPlus className="text-emerald-600" /> Persönliche Angaben & Anamnese
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Vor- und Nachname *</label>
                <input type="text" className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-emerald-600 bg-zinc-50/50 font-medium" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Geburtsdatum *</label>
                <input type="date" className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-emerald-600 bg-zinc-50/50 font-medium" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Anschrift (Straße, PLZ, Ort) *</label>
                <input type="text" className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-emerald-600 bg-zinc-50/50 font-medium" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Telefonnummer *</label>
                <input type="tel" className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-emerald-600 bg-zinc-50/50 font-medium" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">E-Mail-Adresse</label>
                <input type="email" className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-emerald-600 bg-zinc-50/50 font-medium" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Körpergröße (cm)</label>
                <input type="number" className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-emerald-600 bg-zinc-50/50 font-medium" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Gewicht (kg)</label>
                <input type="number" className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-emerald-600 bg-zinc-50/50 font-medium" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Versicherungsstatus</label>
                <select className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-emerald-600 bg-zinc-50/50 font-bold text-zinc-700" value={formData.insurance} onChange={e => setFormData({...formData, insurance: e.target.value})}>
                  <option>Gesetzlich versichert</option>
                  <option>Privat versichert</option>
                  <option>Selbstzahler / Sonstiges</option>
                </select>
              </div>
              
              <div className="md:col-span-2 pt-4 border-t border-zinc-100 space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Bekannte Vorerkrankungen</label>
                <textarea rows={2} className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-emerald-600 bg-zinc-50/50 font-medium resize-none" value={formData.preconditions} onChange={e => setFormData({...formData, preconditions: e.target.value})} />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Regelmäßige Medikamenteneinnahme</label>
                <textarea rows={2} className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-emerald-600 bg-zinc-50/50 font-medium resize-none" value={formData.medication} onChange={e => setFormData({...formData, medication: e.target.value})} />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Allergien oder Unverträglichkeiten</label>
                <textarea rows={2} className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-emerald-600 bg-zinc-50/50 font-medium resize-none" value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})} />
              </div>
            </div>
            <button onClick={handleNext} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg shadow-md transition flex items-center justify-center gap-2">
              Weiter zur Aufklärung <ChevronRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-extrabold text-zinc-900 flex items-center gap-2">
              <Activity className="text-emerald-600" /> Medizinische Aufklärung
            </h2>
            
            <div className="bg-zinc-50 p-6 sm:p-8 rounded-2xl border border-zinc-200 text-zinc-700 text-sm leading-relaxed max-h-[45vh] overflow-y-auto custom-scrollbar shadow-inner space-y-4">
              <h3 className="font-bold text-lg mb-4 text-zinc-900">Patientenaufklärung zur Infusionstherapie und Blutentnahme</h3>
              <p>Sehr geehrte Patientin, sehr geehrter Patient,<br/>im Rahmen Ihrer Behandlung ist eine Infusionstherapie und/oder eine Blutentnahme notwendig. Mit dieser Information möchten wir Sie über den Ablauf und mögliche Begleiterscheinungen aufklären.</p>
              
              <h4 className="font-bold text-base mt-6 mb-2 text-zinc-900">Infusionstherapie</h4>
              <p>Bei einer Infusionstherapie werden Ihnen Flüssigkeiten, Medikamente oder Nährstoffe über eine Vene direkt in den Blutkreislauf verabreicht. Dazu wird meist eine Vene am Unterarm oder an der Hand punktiert, in die ein kleiner Plastikschlauch (Venenverweilkanüle) eingeführt wird.</p>
              
              <h4 className="font-bold mt-4 mb-2 text-zinc-900">Mögliche Begleiterscheinungen:</h4>
              <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Blaue Flecken (Hämatome):</strong> An der Punktionsstelle kann es zu einem Bluterguss kommen. Dies ist meist harmlos und bildet sich von selbst wieder zurück.</li>
                  <li><strong>Paravasat (Infusion läuft ins Gewebe):</strong> In seltenen Fällen kann die Infusion danebenlaufen und ins umliegende Gewebe statt in die Vene gelangen. Dies kann zu Schwellung, Rötung, Schmerzen oder in seltenen Fällen Gewebeschäden führen. Bitte melden Sie sich sofort, wenn Sie während der Infusion Schmerzen, Brennen oder ein Spannungsgefühl verspüren.</li>
              </ul>
              
              <h4 className="font-bold text-base mt-6 mb-2 text-zinc-900">Blutentnahme</h4>
              <p>Bei der Blutentnahme wird Ihnen mit einer Nadel Blut aus einer Vene (meist am Arm) entnommen. Dies dient diagnostischen Zwecken und ist ein Routineverfahren.</p>
              
              <h4 className="font-bold mt-4 mb-2 text-zinc-900">Mögliche Begleiterscheinungen:</h4>
              <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Blaue Flecken (Hämatome):</strong> Auch hier kann es an der Einstichstelle zu einem Bluterguss kommen, insbesondere wenn die Vene tiefer liegt oder empfindlich ist.</li>
                  <li><strong>Schwellung oder leichte Schmerzen:</strong> Diese klingen in der Regel rasch wieder ab. Eine kurzzeitige Schonung des Arms kann hilfreich sein.</li>
              </ul>
              
              <h4 className="font-bold mt-6 mb-2 text-zinc-900">Was Sie beachten sollten</h4>
              <ul className="list-disc pl-5 space-y-2">
                  <li>Halten Sie die Punktionsstelle nach der Blutentnahme oder dem Entfernen der Infusion etwa 2-3 Minuten gut gedrückt, um Blutergüsse zu vermeiden.</li>
                  <li>Melden Sie sich bitte beim Pflegepersonal oder bei den behandelnden Ärzt*innen, wenn Sie ungewöhnliche Schmerzen, starke Schwellungen, Taubheitsgefühle oder andere Beschwerden bemerken.</li>
              </ul>
              
              <h4 className="font-bold mt-6 mb-2 text-zinc-900">Abschließende Hinweise</h4>
              <p>Die Verfahren sind in der Regel sicher und werden täglich vielfach durchgeführt. Dennoch ist es wichtig, dass Sie über mögliche Begleiterscheinungen Bescheid wissen, damit im Fall von Beschwerden schnell reagiert werden kann.</p>
            </div>
            
            <div className="space-y-3">
              <div 
                onClick={() => setConsentInfusion(!consentInfusion)}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                  consentInfusion ? "bg-emerald-50/60 border-emerald-500" : "bg-zinc-50/50 border-zinc-200"
                )}
              >
                <div className={cn("w-6 h-6 border-2 rounded flex items-center justify-center shrink-0", consentInfusion ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white")}>
                  {consentInfusion && <CheckIcon />}
                </div>
                <p className="font-bold text-sm text-zinc-700 select-none">Ich habe die Aufklärung gelesen und willige in die Infusionstherapie ein.</p>
              </div>

              <div 
                onClick={() => setConsentBlood(!consentBlood)}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                  consentBlood ? "bg-emerald-50/60 border-emerald-500" : "bg-zinc-50/50 border-zinc-200"
                )}
              >
                <div className={cn("w-6 h-6 border-2 rounded flex items-center justify-center shrink-0", consentBlood ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white")}>
                  {consentBlood && <CheckIcon />}
                </div>
                <p className="font-bold text-sm text-zinc-700 select-none">Ich habe die Aufklärung gelesen und willige in die Blutentnahme ein.</p>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-zinc-100">
              <button onClick={() => setStep(1)} className="px-6 py-4 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition">Zurück</button>
              <button onClick={() => setStep(3)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg shadow-md transition flex items-center justify-center gap-2">
                Weiter zum Datenschutz <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-extrabold text-zinc-900 flex items-center gap-2">
              <Shield className="text-emerald-600" /> Datenschutz & Digitale Signatur
            </h2>
            
            <div className="bg-zinc-50 p-6 sm:p-8 rounded-2xl border border-zinc-200 text-zinc-600 text-sm leading-relaxed max-h-[35vh] overflow-y-auto custom-scrollbar shadow-inner space-y-4">
              <h3 className="font-bold text-lg mb-4 text-zinc-900">Patienteninformation zum Datenschutz</h3>
              
              <h4 className="font-bold text-zinc-900 mt-4 mb-2">Zweck der Datenverarbeitung</h4>
              <p>Die Datenverarbeitung erfolgt aufgrund gesetzlicher Vorgaben, um den Behandlungsvertrag zwischen Ihnen und unserer Praxis und die damit verbundenen Pflichten zu erfüllen. Hierzu verarbeiten wir Ihre personenbezogenen Daten, insbesondere Ihre Gesundheitsdaten. Dazu zählen Anamnesen, Diagnosen, Therapievorschläge, Laboraufträge und Befunde, die wir oder andere Ärzte erheben. Zu diesen Zwecken können uns auch andere Ärzte oder Psychotherapeuten und Physiotherapeuten, bei denen Sie in Behandlung sind, Daten zur Verfügung stellen (z.B. in Arztbriefen). Die Erhebung von Gesundheitsdaten ist Voraussetzung für Ihre Behandlung. Werden die notwendigen Informationen nicht bereitgestellt, kann eine sorgfältige Behandlung nicht erfolgen.</p>
              
              <h4 className="font-bold text-zinc-900 mt-4 mb-2">Empfänger Ihrer Daten</h4>
              <p>Wir übermitteln Ihre personenbezogenen Daten nur dann an Dritte, wenn dies gesetzlich erlaubt ist oder Sie eingewilligt haben. Empfänger Ihrer personenbezogenen Daten können vor allem andere Ärzte / Psychotherapeuten / Physiotherapeuten, Krankenkassen, der Medizinische Dienst der Krankenversicherung, Labore, Ärztekammern und privatärztliche Verrechnungsstellen sein. Die Übermittlung erfolgt überwiegend zum Zwecke der Abrechnung der bei Ihnen erbrachten Leistungen, zur Klärung von medizinischen und sich aus Ihrem Versicherungsverhältnis ergebenden Questions. Im Einzelfall erfolgt die Übermittlung von Daten an weitere berechtigte Empfänger.</p>
              
              <h4 className="font-bold text-zinc-900 mt-4 mb-2">Speicherung Ihrer Daten</h4>
              <p>Wir bewahren Ihre personenbezogenen Daten nur solange auf, wie dies zur Durchführung der Behandlung erforderlich ist. Aufgrund rechtlicher Vorgaben sind wir dazu verpflichtet, diese Daten mindestens 10 Jahre nach Abschluss der Behandlung aufzubewahren.</p>
              
              <h4 className="font-bold text-zinc-900 mt-4 mb-2">Ihre Rechte</h4>
              <p>Sie haben das Recht, über die Sie betreffenden personenbezogenen Daten Auskunft zu erhalten. Auch können Sie die Berichtigung unrichtiger Daten verlangen. Darüber hinaus steht Ihnen unter bestimmten Voraussetzungen das Recht auf Löschung von Daten, das Recht auf Einschränkung der Datenverarbeitung sowie das Recht auf Datenübertragbarkeit zu. Die Verarbeitung Ihrer Daten erfolgt auf Basis von gesetzlichen Regelungen. Nur in Ausnahmefällen benötigen wir Ihr Einverständnis. In diesen Fällen haben Sie das Recht, die Einwilligung für die zukünftige Verarbeitung zu widerrufen. Sie haben ferner das Recht, sich bei der zuständigen Aufsichtsbehörde für den Datenschutz zu beschweren, wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen nicht rechtmäßig erfolgt.</p>
              
              <h4 className="font-bold text-zinc-900 mt-4 mb-2">Rechtliche Grundlagen</h4>
              <p>Rechtsgrundlage für die Verarbeitung Ihrer Daten ist Artikel 9 Abs. 2 lit.h) DSGVO in Verbindung mit §22 Abs 1 Nr.1 lit.b) Bundesdatenschutzgesetz.</p>
              
              <div className="mt-8 pt-6 border-t border-zinc-200">
                  <h3 className="font-bold text-lg mb-4 text-zinc-900">Zusatz: Digitale Patientenaufnahme per Tablet</h3>
                  <p>Zur Optimierung unserer Praxisabläufe und im Sinne der Nachhaltigkeit nutzen wir für die Patientenaufnahme, die Anamnese sowie für medizinische Aufklärungen und Einwilligungen ein digitales Erfassungssystem (Tablet).</p>
                  
                  <h4 className="font-bold text-zinc-900 mt-4 mb-2">1. Art und Zweck der Verarbeitung</h4>
                  <p>Wenn Sie Ihre Daten über unser Praxis-Tablet eingeben, erheben wir Ihre Stammdaten sowie Gesundheitsdaten. Diese Daten dienen ausschließlich der Vorbereitung und Durchführung Ihres Behandlungsvertrages, der medizinischen Diagnostik und der gesetzlichen Dokumentationspflicht. Die von Ihnen auf dem Tablet eingegebenen Daten und Ihre digitale Unterschrift werden unmittelbar in ein verschlüsseltes PDF-Dokument umgewandelt und in Ihre elektronische Patientenakte übertragen.</p>
                  
                  <h4 className="font-bold text-zinc-900 mt-4 mb-2">2. Speicherung und Datensicherheit</h4>
                  <p>Ihre sensiblen Gesundheitsdaten werden auf dem Tablet nur für den Moment der Eingabe zwischengespeichert. Nach Abschluss der Eingabe oder bei Inaktivität werden die Daten lokal vom Gerät gelöscht. Die technische Bereitstellung der App-Oberfläche erfolgt über unseren IT-Dienstleister (Google Cloud EMEA Limited / Firebase). Die Server für diesen Dienst befinden sich innerhalb der Europäischen Union (Belgien), sodass ein hohes Datenschutzniveau gemäß der europäischen DSGVO gewährleistet ist. Mit dem Anbieter wurde ein entsprechender Vertrag zur Auftragsverarbeitung (AVV) gemäß Art. 28 DSGVO geschlossen. Es werden keine Gesundheitsdaten oder Anamnesebögen in der Cloud-Datenbank dieses Anbieters gespeichert.</p>
              </div>
            </div>

            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
              <p className="font-bold text-emerald-900 text-sm mb-3">Übermittlung von Daten/Befunden per Mail/Fax an mich:</p>
              <div className="flex gap-3">
                <button onClick={() => setTransmitData('yes')} className={cn("flex-1 py-3 rounded-xl font-bold text-sm border-2 transition", transmitData === 'yes' ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-white text-zinc-500 border-zinc-200")}>JA</button>
                <button onClick={() => setTransmitData('no')} className={cn("flex-1 py-3 rounded-xl font-bold text-sm border-2 transition", transmitData === 'no' ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-white text-zinc-500 border-zinc-200")}>NEIN</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Ort der Unterschrift</label>
                <input type="text" className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-emerald-600 bg-white font-medium" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Datum</label>
                <input type="date" className="w-full border-2 border-zinc-100 p-3 rounded-xl outline-none focus:border-emerald-600 bg-white font-medium" value={formData.signatureDate} onChange={e => setFormData({...formData, signatureDate: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Bitte im Feld unterschreiben</label>
              <div className="border-2 border-dashed border-zinc-300 rounded-2xl overflow-hidden bg-zinc-50/50 h-48 relative group">
                <canvas 
                  ref={canvasRef}
                  width={600}
                  height={200}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={() => setIsDrawing(false)}
                  onMouseLeave={() => setIsDrawing(false)}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={() => setIsDrawing(false)}
                  className="w-full h-full cursor-crosshair touch-none"
                />
                <button 
                  type="button"
                  onClick={clearCanvas}
                  className="absolute bottom-3 right-3 bg-white text-zinc-500 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border border-zinc-200 hover:bg-zinc-100 flex items-center gap-1"
                >
                  <RotateCcw size={12} /> Löschen
                </button>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setStep(2)} className="px-6 py-4 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition">Zurück</button>
              <button onClick={handleSaveAndSend} className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-xl font-bold text-lg shadow-md transition flex items-center justify-center gap-2">
                <Save size={20} /> Speichern & Abschließen
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}