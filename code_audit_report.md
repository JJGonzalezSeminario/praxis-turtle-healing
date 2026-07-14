# Code-Audit: Turtle-Healing Praxisverwaltung
**Analyst:** Senior Full-Stack Architect / Security Auditor  
**Datum:** 2026-06-29  
**Scope:** `src/`, `middleware.ts`, Supabase-Integration

---

## 1. ARCHITEKTUR & CODE-QUALITÄT (FRONTEND)

### 1.1 Server vs. Client Components — Massive Fehlorientierung

**Problem:** Das `dashboard/page.tsx` ist mit `'use client'` markiert und lädt **alle Daten client-seitig** über mehrere sequenzielle `useEffect`-Calls. Das ist das Gegenteil des App Router-Paradigmas.

- `dashboard/page.tsx` Zeile 1: `'use client'`
- `admin/nutzer/page.tsx` Zeile 1: `'use client'`

**Konsequenz:**
1. Kein SEO (da kein serverseitig gerenderter Content).
2. Jeder Page-Load feuert 4–5 separate DB-Roundtrips **sequenziell** (erst user → dann shifts → dann profiles → dann patients → dann news).
3. Der Browser lädt zuerst einen leeren Shell und muss dann warten — sichtbares FOUC (Flash of Unstyled Content) und Loading-State.
4. Der `SessionProvider` wird befüllt, aber das Dashboard ignoriert ihn vollständig und macht einen **eigenen Auth-Check** via `supabase.auth.getUser()`.

**Lösung:** Dashboard als async Server Component mit parallelen Queries.

### 1.2 Prop-Drilling und State-Management

**Problem:** Das `UserProfile` wird korrekt als Server-Side-Session in `AppLayout` geladen und über `SessionProvider` bereitgestellt. Das Dashboard ignoriert diesen Context jedoch komplett (`setUserProfile(profile)` via eigenen API-Call, Zeile 41).

- `dashboard/page.tsx` Zeilen 39–48: Komplette Session-Neuinitialisierung im Client, obwohl der `useSession()` Hook existiert.

**Anti-Pattern:** Der `formData`-State in `admin/nutzer/page.tsx` wird durch ein einzelnes Objekt für drei verschiedene Modal-Typen (create/edit/password) geteilt. Beim Öffnen des Passwort-Modals (`openPasswordModal`) wird der State mit `{ ...formData, password: '' }` gesetzt (Zeile 112), was bedeutet, dass ältere Werte (z.B. E-Mail eines zuvor bearbeiteten Users) im State verbleiben.

### 1.3 UI/UX und Accessibility

**Kritische Probleme:**
- `PatientForm.tsx` Zeile 272: Das Passwort-Eingabefeld für das Admin-Formular hat `type="text"` — das Passwort wird im Klartext sichtbar dargestellt.
- Keine `<label htmlFor>` → `<input id>` Verknüpfungen in `PatientForm.tsx`. Alle Labels sind visuell, aber nicht semantisch korrekt. Screen Reader können die Felder nicht zuordnen.
- `startDrawing` / `draw` Events verwenden `e: any` (Zeilen 41, 52). Kein korrektes TypeScript.
- `window.location.reload()` (Zeile 244) statt `router.refresh()` — bricht Next.js-Navigation-State und ist eine Regression zu Pre-App-Router-Methoden.

---

## 2. BACKEND, DATENBANK & SUPABASE-INTEGRATION

### 2.1 N+1 Query Problem im Dashboard

**Datei:** `dashboard/page.tsx`, Zeilen 59–73

```typescript
// N+1 ANTI-PATTERN:
const { data: allShifts } = await supabase.from('shifts').select('*')  // Alle Schichten laden!
const { data: allProfiles } = await supabase.from('profiles').select('id, full_name')  // Alle Profile laden!

// Dann client-seitig joinen:
const shiftsWithNames = todays.map(shift => {
  const matchedProfile = allProfiles?.find(p => p.id === shift.user_id) // O(n*m) Lookup
```

Dies lädt **ALLE** Schichten und **ALLE** Profile der gesamten Datenbank in den Browser, nur um daraus die heutigen herauszufiltern. Bei 500 Schichten und 20 Profilen werden 520 Datensätze übertragen, obwohl benötigt werden: die ~5 Schichten von heute.

Die korrekte Query ist bereits in `lib/data/shifts.ts` implementiert (mit korrektem Join via `profiles!shifts_user_id_fkey`). Das Dashboard nutzt diese Funktion nicht.

### 2.2 Datenredundanz: E-Mail in `profiles`

**Datei:** `admin-users.ts`, Zeilen 32, 53

Die E-Mail-Adresse wird sowohl in `auth.users` (Supabase Auth, Single Source of Truth) als auch in `public.profiles.email` gespeichert. 

**Problem:** Diese Felder können auseinanderlaufen:
- Ein User ändert seine E-Mail in Auth → Profil wird nicht automatisch aktualisiert.
- Die `updateUser`-Funktion aktualisiert beide, aber es gibt keine DB-Constraint, die die Konsistenz erzwingt.

**Lösung:** Entweder `profiles.email` entfernen und immer live aus Auth lesen (sauber), oder einen Datenbank-Trigger einrichten, der `profiles.email` bei `auth.users`-Updates synchronisiert.

### 2.3 Supabase Admin Client: Modul-Level Singleton

**Datei:** `admin-users.ts`, Zeilen 9–11

```typescript
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})
```

Der Admin-Client wird auf **Modul-Level** initialisiert. In Next.js Server Actions ist das eine Race Condition: Bei gleichzeitigen Requests können Requests denselben Client-State teilen, was zu unvorhersehbarem Verhalten führen kann. Der Client sollte per Request neu erstellt werden.

### 2.4 `updateShift` akzeptiert `data: any`

**Datei:** `lib/actions/shifts.ts`, Zeile 50

`updateShift(id: string, data: any)` — kein TypeScript-Typ für die Eingabe. Weder Validierung noch Typsicherheit. Ein Angreifer, der Server Actions manipulieren kann, könnte beliebige Felder in die `shifts`-Tabelle schreiben.

---

## 3. SICHERHEIT & DSGVO-COMPLIANCE (KRITISCH)

### 3.1 🔴 KRITISCH: Keine Server-seitige Authorisierungsprüfung in Server Actions

**Datei:** `lib/actions/shifts.ts`, alle Funktionen  
**Datei:** `admin-users.ts`, alle Funktionen

Keine einzige Server Action prüft, **wer** sie aufruft. `createShift`, `deleteShift`, `createUser`, `resetPassword` — alle sind öffentlich aufrufbar ohne Prüfung der Nutzerrolle.

**Angriffsszenario:** Ein Angreifer ruft direkt die `resetPassword`-Server-Action auf und setzt das Passwort eines Admin-Accounts auf einen bekannten Wert. Es gibt keine Prüfung ob der aufrufende User überhaupt Admin-Rechte hat.

```typescript
// IST:
export async function resetPassword(userId: string, newPassword: string) {
  // Keine Auth-Prüfung!
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword })
}

// MUSS SEIN:
export async function resetPassword(userId: string, newPassword: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  const { data: profile } = await supabase.from('profiles')
    .select('roles(slug)')
    .eq('id', user.id)
    .single()
  
  if (profile?.roles?.slug !== 'super_admin') throw new Error('Forbidden')
  // ...
}
```

### 3.2 🔴 KRITISCH: Passwort wird im Klartext im DOM angezeigt

**Datei:** `admin/nutzer/page.tsx`, Zeile 272

```html
<input type="text" required minLength={6} placeholder="z.B. Turtle2026!" ...>
```

Das Passwort-Eingabefeld hat `type="text"`. Das bedeutet:
1. Das Passwort ist für jeden sichtbar, der auf den Bildschirm schaut.
2. Browser speichern es im Autocomplete als Klartext.
3. Browser-Password-Manager erkennen es nicht als Passwort-Feld.

**Sofortmaßnahme:** `type="password"` verwenden.

### 3.3 🔴 KRITISCH: Medizinische Daten im Browser-Speicher ohne automatische Bereinigung

**Datei:** `PatientForm.tsx`

Der `formData`-State enthält Name, Geburtsdatum, Adresse, Telefon, Vorerkrankungen, Medikamente und Allergien. Nach Abschluss des Formulars (Zeile 230: `setIsSuccess(true)`) bleibt dieser State im React-Komponentenbaum erhalten. Ein Reload via `window.location.reload()` löscht ihn, aber:

1. Zwischen `setIsSuccess(true)` und dem Reload verbleiben alle Daten im Speicher.
2. Wenn der Erfolgs-Screen gezeigt wird und ein anderer Nutzer das Tablet übernimmt, ohne zu reloaden, sind die alten Patientendaten noch im State.
3. Browser-Dev-Tools können React-State auslesen.

Die Datenschutzerklärung im PDF (Zeile 204) behauptet: *"Nach Abschluss der Eingabe oder bei Inaktivität werden die Daten lokal vom Gerät gelöscht."* — Das ist technisch eine **Lüge**. Es gibt keinen Mechanismus dafür.

**DSGVO-Konsequenz:** Das ist Art. 5 Abs. 1 lit. f DSGVO (Integrität/Vertraulichkeit) und ggf. Art. 32 DSGVO (Sicherheit der Verarbeitung) relevant. Die Datenschutzerklärung stimmt nicht mit der tatsächlichen Implementierung überein.

### 3.4 🔴 KRITISCH: `supabaseAdmin` Service Role Key auf Modul-Ebene in Bundle-Gefahr

Der Service Role Key wird in `admin-users.ts` aus `process.env.SUPABASE_SERVICE_ROLE_KEY` gelesen. Da die Datei `'use server'` markiert ist, bleibt der Key server-seitig. Das ist korrekt. **Aber:** Es gibt keinen expliziten Check, ob der Key überhaupt gesetzt ist. Bei leerem Key (`''`) erzeugt `createClient` möglicherweise keinen Fehler beim Initialisieren, sondern erst bei tatsächlicher Nutzung — mit einer kryptischen Fehlermeldung.

### 3.5 🟡 WICHTIG: Middleware ist kein vollständiger Autorisierungsschutz

**Datei:** `middleware.ts`

Die Middleware prüft nur: eingeloggt ja/nein. Sie prüft **keine Rollen**. Ein eingeloggter Patient kann `/admin/nutzer` aufrufen. Der Schutz liegt ausschließlich in der UI-Logik (Sidebar zeigt den Link nicht an), nicht in der Route selbst.

**Fehlender Schutz:** Die Seiten unter `/admin` haben keinen serverseitigen Rollen-Check. `getSessionOrRedirect()` in `AppLayout` prüft nur Auth, nicht Rolle.

### 3.6 🟡 WICHTIG: `is_super_admin` basiert auf einem String-Vergleich

**Datei:** `get-session.ts`, Zeile 60

```typescript
is_super_admin: profile.roles?.slug === 'super_admin',
```

Wenn jemand mit DB-Zugriff den Slug einer Rolle auf `'super_admin'` setzt oder eine neue Rolle mit diesem Slug anlegt, erhält er automatisch Super-Admin-Rechte. Dies ist kein gehärteter Mechanismus. Besser wäre ein Boolean-Flag `is_super_admin` direkt in der `profiles`-Tabelle, das nur manuell über die Datenbank gesetzt werden kann.

### 3.7 🟡 WICHTIG: Falscher IT-Dienstleister in der Datenschutzerklärung

**Datei:** `PatientForm.tsx`, Zeile 473 (generiertes PDF)

```
"Die technische Bereitstellung der App-Oberfläche erfolgt über unseren IT-Dienstleister
(Google Cloud EMEA Limited / Firebase)"
```

Das System nutzt **Supabase** (mit PostgreSQL auf AWS/Fly.io), **nicht Firebase**. Die Datenschutzerklärung nennt den falschen Anbieter. Das ist ein direkter DSGVO-Verstoß (Art. 13 DSGVO: Informationspflicht). Der AVV muss mit dem tatsächlichen Anbieter (Supabase Inc.) geschlossen worden sein, nicht mit Google/Firebase.

---

## 4. LOGISCHE FUNKTIONALITÄT & EDGE CASES

### 4.1 Race Condition: `postNews` ohne Feedback bei Fehler

**Datei:** `dashboard/page.tsx`, Zeilen 103–116

```typescript
const { error } = await supabase.from('news_board').insert([...])
if (!error) {
  setNewMessage('')
  fetchNews()
}
// Kein else-Branch! Fehler werden stillschweigend ignoriert.
```

Wenn das Insert fehlschlägt (Netzwerkausfall, RLS-Policy-Verletzung), passiert nichts. Der Nutzer denkt, seine Nachricht wurde gesendet, aber sie ist verschwunden.

### 4.2 `deleteNews` ohne Confirmation und ohne Error-Handling

**Datei:** `dashboard/page.tsx`, Zeilen 118–121

```typescript
const deleteNews = async (id: string) => {
  await supabase.from('news_board').delete().eq('id', id)
  fetchNews() // Kein Error Check
}
```

Kein `await` auf Fehler, keine Bestätigungsdialog, keine User-Feedback bei Fehler.

### 4.3 Redirect-Loop-Risiko im Dashboard

**Datei:** `dashboard/page.tsx`, Zeilen 43–47

```typescript
if (profile?.roles?.name === 'Patient') {
  router.push('/patientenaufnahme')
  return
}
```

Wenn das Profil des Patienten keine Rolle hat (weil `role_id` null ist, Praxis Tablet-Profil z.B.), gibt es kein Redirect. Aber die eigentliche Gefahr: `router.push()` ist asynchron. Das `return` danach stoppt zwar die JS-Ausführung der Funktion, aber der React-State `setLoading(false)` weiter unten (Zeile 95) hat noch keinen Einfluss. Die Component könnte kurz mit einem leeren State rendern, bevor der Router die Navigation abschließt.

### 4.4 Undefiniertes Verhalten bei leerem Canvas

**Datei:** `PatientForm.tsx`, Zeile 212

```typescript
const sigImage = canvasRef.current.toDataURL('image/png')
```

Es wird **nicht geprüft**, ob die Unterschrift leer ist (der User hat nichts gezeichnet). Ein leeres Canvas-PNG wird als "Unterschrift" akzeptiert und ins PDF eingefügt. Das PDF erweckt den Eindruck einer gültigen Unterschrift, obwohl keine vorhanden ist.

### 4.5 `createShift` ohne Validierung des Datumsbereichs

**Datei:** `lib/actions/shifts.ts`, Zeilen 17–37

Wenn `end_date < start_date`, wird die Schleife nie ausgeführt und es wird ein leeres Array inseriert. `supabase.insert([])` ist ein No-Op ohne Fehler. Der Nutzer sieht `{ success: true }`, obwohl keine Schichten erstellt wurden.

### 4.6 `deleteShift` mit potenzieller Null-Dereferenzierung

**Datei:** `lib/actions/shifts.ts`, Zeilen 78–83

Wenn `shift?.group_id` null ist und der Nutzer "Gruppe löschen" wählt, wird nur der einzelne Tag gelöscht (Fallback in Zeile 82). Der Nutzer wird **nicht informiert**, dass die Gruppe nicht gelöscht werden konnte. Stille Degradation.

---

## 5. BUGS & ANTI-PATTERNS

| # | Schwere | Datei | Zeile | Problem |
|---|---------|-------|-------|---------|
| 1 | 🔴 Kritisch | `admin/nutzer/page.tsx` | 272 | `type="text"` für Passwort-Feld — Klartext-Anzeige |
| 2 | 🔴 Kritisch | `lib/actions/shifts.ts` | alle | Keine Authorisierungsprüfung in Server Actions |
| 3 | 🔴 Kritisch | `app/actions/admin-users.ts` | alle | Keine Authorisierungsprüfung in Server Actions |
| 4 | 🔴 Kritisch | `PatientForm.tsx` | 204 | Falsche Datenschutzerklärung (Firebase statt Supabase) |
| 5 | 🔴 Kritisch | `PatientForm.tsx` | 212 | Keine Prüfung ob Canvas leer (keine Unterschrift) |
| 6 | 🟡 Wichtig | `dashboard/page.tsx` | 59–60 | N+1: Alle Shifts + Profiles geladen, client-seitig gefiltert |
| 7 | 🟡 Wichtig | `dashboard/page.tsx` | 41 | Doppelte Session-Abfrage, ignoriert SessionProvider Context |
| 8 | 🟡 Wichtig | `dashboard/page.tsx` | 107–115 | Keine Error-Behandlung bei `postNews` |
| 9 | 🟡 Wichtig | `dashboard/page.tsx` | 118–121 | Keine Bestätigung/Error-Handling bei `deleteNews` |
| 10 | 🟡 Wichtig | `PatientForm.tsx` | 230 | Patientendaten bleiben nach Success im State |
| 11 | 🟡 Wichtig | `get-session.ts` | 60 | Slug-basierter Super-Admin Check — manipulierbar |
| 12 | 🟡 Wichtig | `admin-users.ts` | 9–11 | Admin-Client als Modul-Level Singleton |
| 13 | 🟡 Wichtig | `middleware.ts` | gesamt | Prüft Auth aber nicht Rollen für Admin-Routen |
| 14 | 🔵 Nice-to-have | `lib/actions/shifts.ts` | 50 | `data: any` ohne TypeScript-Typ |
| 15 | 🔵 Nice-to-have | `dashboard/page.tsx` | 1 | `'use client'` für eine Seite, die Server-gerendert sein sollte |
| 16 | 🔵 Nice-to-have | `PatientForm.tsx` | 41, 52 | `e: any` statt korrekter Touch/Mouse Event Types |
| 17 | 🔵 Nice-to-have | `PatientForm.tsx` | 244 | `window.location.reload()` statt `router.refresh()` |
| 18 | 🔵 Nice-to-have | `admin-users.ts` | 32, 53 | E-Mail in `profiles` ist redundant zu `auth.users` |

---

## 6. KONKRETE HANDLUNGSANWEISUNGEN (REFACTORING)

### 🔴 KRITISCH #1: Authorisierung in Server Actions

**Für alle Server Actions in `lib/actions/shifts.ts` und `app/actions/admin-users.ts`:**

```typescript
// lib/actions/shifts.ts — Vorlage für alle Actions:
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireRole(allowedSlugs: string[]) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Nicht authentifiziert.')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('roles(slug)')
    .eq('id', user.id)
    .single()
  
  const roleSlug = (profile as any)?.roles?.slug
  
  if (!allowedSlugs.includes(roleSlug)) {
    throw new Error(`Unzureichende Rechte. Benötigt: ${allowedSlugs.join(', ')}`)
  }
  
  return user
}

export async function createShift(formData: { ... }) {
  await requireRole(['super_admin', 'leitungskraft']) // Nur diese Rollen dürfen
  // ... Rest der Funktion
}

export async function resetPassword(userId: string, newPassword: string) {
  await requireRole(['super_admin']) // Nur Super Admin
  // ...
}
```

### 🔴 KRITISCH #2: Passwort-Feld fix

**Datei:** `admin/nutzer/page.tsx`, Zeile 272

```diff
- <input type="text" required minLength={6} placeholder="z.B. Turtle2026!" ...>
+ <input type="password" required minLength={8} autoComplete="new-password" placeholder="Mind. 8 Zeichen" ...>
```

### 🔴 KRITISCH #3: Patientendaten-Bereinigung nach Abschluss

**Datei:** `PatientForm.tsx`

```typescript
// Nach erfolgreichem Abschluss State sofort leeren:
const handleSaveAndSend = async () => {
  // ... PDF generieren ...
  
  await supabase.from('patient_intakes').insert([{}])
  
  // SOFORT alle sensiblen Daten aus dem State entfernen:
  setFormData({
    name: '', birthDate: '', address: '', phone: '', email: '',
    insurance: 'Gesetzlich versichert', weight: '', height: '',
    preconditions: '', medication: '', allergies: '',
    location: 'Berlin',
    signatureDate: new Date().toISOString().split('T')[0]
  })
  clearCanvas()
  setConsentInfusion(false)
  setConsentBlood(false)
  setTransmitData(null)
  
  setIsSuccess(true)
}

// "Nächster Patient" Button: router.refresh() statt window.location.reload()
<button onClick={() => router.refresh()}>Nächster Patient</button>
```

### 🔴 KRITISCH #4: Unterschrift-Validierung

**Datei:** `PatientForm.tsx`

```typescript
const isCanvasEmpty = (): boolean => {
  if (!canvasRef.current) return true
  const ctx = canvasRef.current.getContext('2d')
  if (!ctx) return true
  const pixelBuffer = new Uint32Array(
    ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height).data.buffer
  )
  return !pixelBuffer.some(color => color !== 0)
}

const handleSaveAndSend = async () => {
  if (isCanvasEmpty()) {
    alert('Bitte unterschreiben Sie das Formular vor dem Abspeichern.')
    return
  }
  // ...
}
```

### 🟡 WICHTIG #1: Dashboard — N+1 Query fixen

**Ersetze** `dashboard/page.tsx` mit einer Server Component die korrekte Joins nutzt:

```typescript
// dashboard/page.tsx — Server Component (kein 'use client')
import { getSessionOrRedirect } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient' // Client-Teil auslagern

export default async function DashboardPage() {
  const profile = await getSessionOrRedirect()
  
  // Patienten-Redirect server-seitig:
  if (profile.role?.slug === 'patient') {
    redirect('/patientenaufnahme')
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Parallel laden statt sequenziell:
  const [ordersResult, shiftsResult, patientResult, newsResult] = await Promise.all([
    supabase.from('inventory').select('*', { count: 'exact', head: true }).eq('status', 'offen'),
    supabase.from('shifts')
      .select('*, profiles!shifts_user_id_fkey(full_name)')
      .eq('date', today),  // Nur heute, kein Filter im Client
    supabase.from('patient_intakes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`),
    supabase.from('news_board')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(20)
  ])

  return (
    <DashboardClient
      profile={profile}
      orderCount={ordersResult.count ?? 0}
      shifts={shiftsResult.data ?? []}
      patientCount={patientResult.count ?? 0}
      news={newsResult.data ?? []}
    />
  )
}
```

### 🟡 WICHTIG #2: Admin-Routen-Schutz in Middleware

**Datei:** `middleware.ts`

```typescript
// Zusätzliche Middleware-Prüfung für Admin-Routen:
// Achtung: Rollen-Check in Middleware benötigt einen extra DB-Query.
// Besser: In den jeweiligen Admin-Layouts per getSessionOrRedirect() + Rollen-Check.

// In src/app/(app)/admin/layout.tsx:
import { getSessionOrRedirect } from '@/lib/auth/get-session'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionOrRedirect()
  
  if (!profile.is_super_admin) {
    redirect('/dashboard')
  }
  
  return <>{children}</>
}
```

### 🟡 WICHTIG #3: Admin-Client per Request erstellen

**Datei:** `app/actions/admin-users.ts`

```typescript
'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'

// NICHT auf Modul-Ebene:
// const supabaseAdmin = createClient(...) ❌

function getAdminClient() {  // ✅ Per Request neu erstellen
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase Admin Credentials fehlen in der Umgebungskonfiguration.')
  }
  
  return createAdminClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function createUser(data: {...}) {
  const supabaseAdmin = getAdminClient()
  // ...
}
```

### 🟡 WICHTIG #4: `updateShift` typisieren

**Datei:** `lib/actions/shifts.ts`

```typescript
interface ShiftUpdateData {
  profile_id: string
  date: string
  start_time: string
  end_time: string
  status: string
  shift_type: string
}

export async function updateShift(id: string, data: ShiftUpdateData) {
  // ...
}
```

### 🟡 WICHTIG #5: Datenschutzerklärung korrigieren

**Datei:** `PatientForm.tsx`, Zeile 204 (und im generierten PDF, Zeile 472–473)

```diff
- "Die technische Bereitstellung der App-Oberfläche erfolgt über unseren IT-Dienstleister
-  (Google Cloud EMEA Limited / Firebase). Die Server für diesen Dienst befinden sich 
-  innerhalb der Europäischen Union (Belgien)..."
+ "Die technische Bereitstellung der App-Oberfläche und die Datenspeicherung erfolgt über 
+  unseren IT-Dienstleister Supabase Inc. (1111B South Governors Avenue, Dover, DE 19904, USA).
+  Mit dem Anbieter wurde ein Vertrag zur Auftragsverarbeitung (AVV) gemäß Art. 28 DSGVO 
+  geschlossen. Supabase nutzt AWS-Infrastruktur mit Datenverarbeitung in der EU..."
```

**HINWEIS:** Prüfen Sie mit Supabase, welche Serverregion für Ihr Projekt konfiguriert ist und passen Sie den Text entsprechend an.

---

## Zusammenfassung nach Priorität

### 🔴 Sofort umsetzen (Sicherheits- und DSGVO-Risiken):
1. Authorisierungsprüfung in allen Server Actions einbauen
2. Passwort-Feld auf `type="password"` ändern
3. Patientendaten nach Abschluss aus State löschen
4. Unterschrift-Validierung einbauen
5. Datenschutzerklärung korrigieren (falscher Anbieter = DSGVO-Verstoß)

### 🟡 Kurzfristig (Code-Qualität und Korrektheit):
6. Admin-Layout mit Rollen-Guard absichern
7. N+1-Query im Dashboard eliminieren (auf Server Component umstellen)
8. Admin-Client per Request erstellen
9. Error-Handling in `postNews` und `deleteNews`
10. Canvas-Leer-Check vor PDF-Generierung

### 🔵 Mittelfristig (Wartbarkeit):
11. Dashboard komplett zu Server Component refactoren
12. `updateShift` typisieren
13. `window.location.reload()` durch `router.refresh()` ersetzen
14. E-Mail-Redundanz zwischen `auth.users` und `profiles` bereinigen
