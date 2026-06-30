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
  openGraph: {
    type: 'website',
    siteName: siteMeta.name,
    title: siteMeta.name,
    description: siteMeta.description,
    url: getSiteUrl(),
  },
  twitter: {
    card: 'summary_large_image',
    title: siteMeta.name,
    description: siteMeta.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: getSiteUrl(),
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
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: siteMeta.name,
              url: getSiteUrl(),
              description: siteMeta.description,
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${getSiteUrl()}/?search={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </body>
    </html>
  )
}
