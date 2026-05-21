'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError('E-Mail-Adresse oder Passwort nicht korrekt.')
        setIsLoading(false)
        return
      }

      // Erfolgreich angemeldet -> Weiterleitung zum geschützten Dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-2xl shadow-sm">
            🐢
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-zinc-950">
            Praxis Turtle-Healing
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Geben Sie Ihre Zugangsdaten ein, um fortzufahren
          </p>
        </div>

        <Card className="border-zinc-200/80 bg-white shadow-xl shadow-zinc-200/30 rounded-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-zinc-900">Anmelden</CardTitle>
            <CardDescription className="text-zinc-500 text-xs">
              Internes Praxisverwaltungs- und QM-System
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle size={16} className="shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-zinc-700">
                  E-Mail-Adresse
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@turtle-healing.de"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="border-zinc-200 focus-visible:ring-emerald-600 bg-zinc-50/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-zinc-700">
                  Passwort
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="border-zinc-200 focus-visible:ring-emerald-600 bg-zinc-50/30"
                />
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-sm transition-colors rounded-xl py-5"
              >
                {isLoading ? 'Verbindung wird hergestellt...' : 'Anmelden'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}