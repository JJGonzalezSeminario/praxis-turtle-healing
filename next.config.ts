import type { NextConfig } from 'next'

const supabaseHost = 'rgbakpsyxronsqeyzuaf.supabase.co'

const securityHeaders = [
  // HSTS: Browser verbindet sich nur noch über HTTPS (2 Jahre)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Verhindert Clickjacking (Einbettung in iframes)
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // Verhindert MIME-Sniffing-Angriffe
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Kontrolliert Referrer-Informationen
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Deaktiviert ungenutzte Browser-Features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  // Content Security Policy: Legt fest, woher Ressourcen geladen werden dürfen
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Bilder: nur eigene Domain, Supabase Storage und Data-URIs
      `img-src 'self' data: blob: https://${supabaseHost}`,
      // Verbindungen: eigene Domain + Supabase (inkl. WebSocket für Realtime)
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
      // Skripte: 'unsafe-inline' & 'unsafe-eval' für Next.js/React erforderlich
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Styles: eigene Domain + inline + Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Schriften: eigene Domain + Google Fonts CDN
      "font-src 'self' https://fonts.gstatic.com",
      // Dateien (für PDF-Viewer): Supabase Storage erlauben
      `frame-src 'self' https://${supabaseHost}`,
      // Kein Einbetten in fremde Seiten
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Alle Routen erhalten die Security Headers
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
