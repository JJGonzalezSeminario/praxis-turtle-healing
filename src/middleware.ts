import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Bereite die Antwort vor
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 2. Verbinde dich mit Supabase, um die Cookies (Login-Status) zu lesen
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Prüfe, ob ein eingeloggter Benutzer existiert
  const { data: { user } } = await supabase.auth.getUser()

  const isLoginPage = request.nextUrl.pathname.startsWith('/login')

  // REGEL 1: NICHT eingeloggt und NICHT auf der Login-Seite? -> Rauswerfen zum Login!
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // REGEL 2: EINGELOGGT, aber versucht auf die Login-Seite oder die Startseite (/) zu gehen? -> Ab ins Dashboard!
  if (user && (isLoginPage || request.nextUrl.pathname === '/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

// 4. Definiere, für welche Seiten dieser Türsteher gelten soll (für alle, außer Bilder/Dateien)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp)$).*)',
  ],
}