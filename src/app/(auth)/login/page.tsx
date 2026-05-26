'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Lock, Mail, AlertCircle, Loader2, 
  Eye, EyeOff, ArrowLeft, Info, X, ShieldAlert, FileCheck 
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  // Formular-States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // UI-Steuerung
  const [showPassword, setShowPassword] = useState(false)
  const [isResetMode, setIsResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  
  // NEU: Steuerung für die rechtlichen Modals
  const [activeLegalModal, setActiveLegalModal] = useState<'impressum' | 'datenschutz' | null>(null)
  
  // Status & Fehler
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Login absenden
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError('E-Mail-Adresse oder Passwort ist nicht korrekt.')
      setLoading(false)
      return
    }

    router.refresh()
    router.push('/dashboard')
  }

  // Passwort zurücksetzen
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (resetError) {
      setError('Fehler beim Senden. Bitte prüfe die E-Mail-Adresse.')
      setLoading(false)
      return
    }

    setResetSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-50 relative overflow-hidden px-4 py-10">
      
      {/* Hintergrund-Effekt */}
      <div className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-teal-100/40 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 flex flex-col items-center flex-1 justify-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Logo & Titel */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-24 h-24 sm:w-28 sm:h-28 relative drop-shadow-xl hover:scale-105 transition-transform duration-500">
            <Image 
              src="/logo.png" 
              alt="Turtle-Healing Logo" 
              fill 
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-teal-900 tracking-tight text-center">
            Praxis Turtle-Healing
          </h1>
        </div>

        {/* Die interagierende Karte */}
        <div className="w-full bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white relative overflow-hidden">
          
          {isResetMode ? (
            /* PASSWORT ZURÜCKSETZEN */
            <div className="animate-in slide-in-from-right-4 fade-in duration-300">
              <button 
                onClick={() => { setIsResetMode(false); setError(''); setResetSent(false); }}
                className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-teal-600 transition-colors mb-6"
              >
                <ArrowLeft size={16} strokeWidth={2.5} /> Zurück zum Login
              </button>
              
              <h2 className="text-xl font-bold text-teal-950 mb-2">Passwort vergessen?</h2>
              <p className="text-sm text-zinc-500 font-medium mb-6">
                Gib deine Praxis-E-Mail ein. Wir senden dir einen sicheren Link, um ein neues Passwort zu vergeben.
              </p>

              {resetSent ? (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center">
                  <Mail className="mx-auto text-emerald-600 mb-3" size={32} />
                  <h3 className="text-emerald-900 font-bold mb-1">E-Mail wurde versendet!</h3>
                  <p className="text-emerald-700 text-sm font-medium">Bitte prüfe dein Postfach (und den Spam-Ordner).</p>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1">E-Mail-Adresse</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-zinc-400 group-focus-within:text-teal-600 transition-colors" />
                      </div>
                      <input 
                        type="email" 
                        required 
                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-zinc-100 rounded-2xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium text-zinc-800" 
                        placeholder="name@turtle-healing.de" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="animate-in fade-in slide-in-from-top-2 bg-rose-50 text-rose-600 text-sm font-bold p-4 rounded-2xl flex items-center gap-3 border border-rose-100">
                      <AlertCircle size={18} className="shrink-0" /> {error}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading || !email} 
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg transition-all flex items-center justify-center gap-2",
                      loading || !email ? "bg-teal-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700 hover:-translate-y-1 shadow-teal-600/30"
                    )}
                  >
                    {loading ? <><Loader2 className="animate-spin" size={20} /> Sendet...</> : 'Link anfordern'}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* NORMALER LOGIN */
            <div className="animate-in slide-in-from-left-4 fade-in duration-300">
              <h2 className="text-xl font-bold text-teal-950 mb-6 flex items-center gap-3 border-b border-zinc-100 pb-4">
                <Lock className="text-teal-600" size={24} /> 
                System-Anmeldung
              </h2>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">E-Mail-Adresse</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-zinc-400 group-focus-within:text-teal-600 transition-colors" />
                    </div>
                    <input 
                      type="email" 
                      required 
                      className="w-full pl-12 pr-4 py-4 bg-white border-2 border-zinc-100 rounded-2xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium text-zinc-800" 
                      placeholder="name@turtle-healing.de" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-end ml-1 mb-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Passwort</label>
                    <button 
                      type="button" 
                      onClick={() => { setIsResetMode(true); setError(''); }}
                      className="text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors"
                      tabIndex={-1}
                    >
                      Vergessen?
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-zinc-400 group-focus-within:text-teal-600 transition-colors" />
                    </div>
                    {/* HIER DIE ÄNDERUNG: type wechselt dynamisch zwischen 'text' und 'password' */}
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      className="w-full pl-12 pr-12 py-4 bg-white border-2 border-zinc-100 rounded-2xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium text-zinc-800"
                      placeholder="••••••••" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-teal-600 transition-colors focus:outline-none"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="animate-in fade-in slide-in-from-top-2 bg-rose-50 text-rose-600 text-sm font-bold p-4 rounded-2xl flex items-center gap-3 border border-rose-100">
                    <AlertCircle size={18} className="shrink-0" /> {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading || !email || !password} 
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg transition-all flex items-center justify-center gap-2 mt-4",
                    loading || !email || !password ? "bg-teal-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700 hover:-translate-y-1 active:scale-95 shadow-teal-600/30"
                  )}
                >
                  {loading ? <><Loader2 className="animate-spin" size={20} /> Prüfe Daten...</> : 'Sicher anmelden'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER FÜR DIE PRAXIS */}
      <div className="mt-auto w-full max-w-md pt-8 text-center space-y-4 relative z-10">
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-zinc-500 bg-white/50 w-fit mx-auto px-4 py-2 rounded-full border border-zinc-200">
          <Info size={14} className="text-teal-600" />
          Probleme beim Login? <a href="mailto:it-support@turtle-healing.de" className="text-teal-600 hover:text-teal-800 transition-colors">IT-Support kontaktieren</a>
        </div>
        
        {/* NEU: Funktionierende Links für Datenschutz und Impressum */}
        <div className="flex items-center justify-center gap-4 text-xs font-bold text-zinc-400">
          <button onClick={() => setActiveLegalModal('datenschutz')} className="hover:text-teal-600 transition-colors">Datenschutz</button>
          <span>•</span>
          <button onClick={() => setActiveLegalModal('impressum')} className="hover:text-teal-600 transition-colors">Impressum</button>
          <span>•</span>
          <span className="font-medium">&copy; {new Date().getFullYear()} Turtle-Healing</span>
        </div>
      </div>

      {/* ================================================================
        NEU: INTERAKTIVE LEGAL MODALS (DATENSCHUTZ / IMPRESSUM OVERLAYS)
        ================================================================
      */}
      {activeLegalModal && (
        <div 
          className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveLegalModal(null)}
        >
          <div 
            className="bg-white rounded-[2.5rem] shadow-2xl border border-zinc-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-xl font-extrabold text-zinc-900 flex items-center gap-2.5">
                {activeLegalModal === 'datenschutz' ? (
                  <><FileCheck className="text-emerald-600" size={22} /> Datenschutzerklärung</>
                ) : (
                  <><ShieldAlert className="text-teal-600" size={22} /> Impressum</>
                )}
              </h2>
              <button 
                onClick={() => setActiveLegalModal(null)}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollbarer Text) */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 text-sm text-zinc-600 leading-relaxed space-y-4 custom-scrollbar">
              {activeLegalModal === 'datenschutz' ? (
                <>
                  <p className="font-bold text-zinc-800 text-base">Patienteninformation zum Datenschutz</p>
                  <p>Die Datenverarbeitung erfolgt aufgrund gesetzlicher Vorgaben, um den Behandlungsvertrag zwischen Ihnen und unserer Praxis und die damit verbundenen Pflichten zu erfüllen. Hierzu verarbeiten wir Ihre personenbezogenen Daten, insbesondere Ihre Gesundheitsdaten. Dazu zählen Anamnesen, Diagnosen, Therapievorschläge, Laboraufträge und Befunde, die wir oder andere Ärzte erheben. Zu diesen Zwecken können uns auch andere Ärzte oder Psychotherapeuten und Physiotherapeuten, bei denen Sie in Behandlung sind, Daten zur Verfügung stellen (z.B. in Arztbriefen). Die Erhebung von Gesundheitsdaten ist Voraussetzung für Ihre Behandlung. Werden die notwendigen Informationen nicht bereitgestellt, kann eine sorgfältige Behandlung nicht erfolgen.</p>
                  
                  <p className="font-bold text-zinc-800 mt-4">Empfänger Ihrer Daten</p>
                  <p>Wir übermitteln Ihre personenbezogenen Daten nur dann an Dritte, wenn dies gesetzlich erlaubt ist oder Sie eingewilligt haben. Empfänger Ihrer personenbezogenen Daten können vor allem andere Ärzte / Psychotherapeuten / Physiotherapeuten, Krankenkassen, der Medizinische Dienst der Krankenversicherung, Labore, Ärztekammern und privatärztliche Verrechnungsstellen sein. Die Übermittlung erfolgt überwiegend zum Zwecke der Abrechnung der bei Ihnen erbrachten Leistungen, zur Klärung von medizinischen und sich aus Ihrem Versicherungsverhältnis ergebenden Fragen. Im Einzelfall erfolgt die Übermittlung von Daten an weitere berechtigte Empfänger.</p>
                  
                  <p className="font-bold text-zinc-800 mt-4">Speicherung Ihrer Daten</p>
                  <p>Wir bewahren Ihre personenbezogenen Daten nur solange auf, wie dies zur Durchführung der Behandlung erforderlich ist. Aufgrund rechtlicher Vorgaben sind wir dazu verpflichtet, diese Daten mindestens 10 Jahre nach Abschluss der Behandlung aufzubewahren.</p>
                  
                  <p className="font-bold text-zinc-800 mt-4">Ihre Rechte</p>
                  <p>Sie haben das Recht, über die Sie betreffenden personenbezogenen Daten Auskunft zu erhalten. Auch können Sie die Berichtigung unrichtiger Daten verlangen. Darüber hinaus steht Ihnen unter bestimmten Voraussetzungen das Recht auf Löschung von Daten, das Recht auf Einschränkung der Datenverarbeitung sowie das Recht auf Datenübertragbarkeit zu. Die Verarbeitung Ihrer Daten erfolgt auf Basis von gesetzlichen Regelungen. Nur in Ausnahmefällen benötigen wir Ihr Einverständnis. In diesen Fällen haben Sie das Recht, die Einwilligung für die zukünftige Verarbeitung zu widerrufen. Sie haben ferner das Recht, sich bei der zuständigen Aufsichtsbehörde für den Datenschutz zu beschweren, wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen nicht rechtmäßig erfolgt.</p>
                  
                  <p className="font-bold text-zinc-800 mt-4">Rechtliche Grundlagen</p>
                  <p>Rechtsgrundlage für die Verarbeitung Ihrer Daten ist Artikel 9 Abs. 2 lit.h) DSGVO in Verbindung mit §22 Abs 1 Nr.1 lit.b) Bundesdatenschutzgesetz.</p>
                  
                  <div className="pt-4 border-t border-zinc-100">
                    <p className="font-bold text-zinc-800 text-base">Zusatz: Digitale Patientenaufnahme per Tablet</p>
                    <p>Zur Optimierung unserer Praxisabläufe und im Sinne der Nachhaltigkeit nutzen wir für die Patientenaufnahme, die Anamnese sowie für medizinische Aufklärungen und Einwilligungen ein digitales Erfassungssystem (Tablet).</p>
                    <p className="font-semibold text-zinc-800 mt-2">1. Art und Zweck der Verarbeitung</p>
                    <p>Wenn Sie Ihre Daten über unser Praxis-Tablet eingeben, erheben wir Ihre Stammdaten sowie Gesundheitsdaten. Diese Daten dienen ausschließlich der Vorbereitung und Durchführung Ihres Behandlungsvertrages, der medizinischen Diagnostik und der gesetzlichen Dokumentationspflicht. Die von Ihnen auf dem Tablet eingegebenen Daten und Ihre digitale Unterschrift werden unmittelbar in ein verschlüsseltes PDF-Dokument umgewandelt und in Ihre elektronische Patientenakte übertragen.</p>
                    <p className="font-semibold text-zinc-800 mt-2">2. Speicherung und Datensicherheit</p>
                    <p>Ihre sensiblen Gesundheitsdaten werden auf dem Tablet nur für den Moment der Eingabe zwischengespeichert. Nach Abschluss der Eingabe oder bei Inaktivität werden die Daten lokal vom Gerät gelöscht. Die technische Bereitstellung der App-Oberfläche erfolgt über unseren IT-Dienstleister (Google Cloud EMEA Limited / Firebase). Die Server für diesen Dienst befinden sich innerhalb der Europäischen Union (Belgien), sodass ein hohes Datenschutzniveau gemäß der europäischen DSGVO gewährleistet ist. Mit dem Anbieter wurde ein entsprechender Vertrag zur Auftragsverarbeitung (AVV) gemäß Art. 28 DSGVO geschlossen. Es werden keine Gesundheitsdaten oder Anamnesebögen in der Cloud-Datenbank dieses Anbieters gespeichert.</p>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-bold text-zinc-800 text-base">Angaben gemäß § 5 TMG</p>
                  <p>Praxis Turtle-Healing<br />Praxis für ganzheitliche Medizin & Naturheilkunde<br />Pariser Str. 21<br />10707 Berlin</p>
                  
                  <p className="font-bold text-zinc-800 mt-4">Vertreten durch:</p>
                  <p>Praxisinhaber / Ärztliche Leitung: Ximena Martinez-Micus</p>
                  
                  <p className="font-bold text-zinc-800 mt-4">Kontakt:</p>
                  <p>Telefon: +49 (0) 30 78890654<br />E-Mail: info@turtle-healing.com<br />Website: www.turtle-healing.com</p>
                  
                  <p className="font-bold text-zinc-800 mt-4">Gesetzliche Berufsbezeichnung:</p>
                  <p>Arzt (verliehen in der Bundesrepublik Deutschland)</p>
                  
                  <p className="font-bold text-zinc-800 mt-4">Zuständige Ärztekammer:</p>
                  <p>Ärztekammer Berlin<br />Friedrichstraße 16<br />10969 Berlin</p>
                  
                  <p className="font-bold text-zinc-800 mt-4">Zuständige Kassenärztliche Vereinigung:</p>
                  <p>KV Berlin<br />Masurenallee 6A<br />14057 Berlin</p>
                  
                  <p className="font-bold text-zinc-800 mt-4">Berufsrechtliche Regelungen:</p>
                  <p>Berufsordnung der Ärztekammer Berlin sowie das Berliner Kammergesetz. Die Regelungen können auf der Website der Ärztekammer Berlin eingesehen werden.</p>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex justify-end">
              <button 
                onClick={() => setActiveLegalModal(null)}
                className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2.5 px-6 rounded-xl text-sm shadow-md transition"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}