import type { Metadata } from 'next'
import '@/app/globals.css'
import { getSiteUrl, siteMeta } from '@/lib/site'
import { LangProvider } from '@/lib/i18n/context'
import { PageTransition } from '@/components/page-transition'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: siteMeta.name,
    template: `%s | ${siteMeta.name}`,
  },
  description: siteMeta.description,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.svg',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='zh-CN' suppressHydrationWarning>
      <body className='antialiased'>
        <LangProvider>
          <PageTransition>{children}</PageTransition>
        </LangProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
