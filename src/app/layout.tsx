import type { Metadata } from 'next'
import '@/app/globals.css'
import { getSiteUrl, siteMeta } from '@/lib/site'
import { LangProvider } from '@/lib/i18n/context'

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: siteMeta.name,
    template: `%s | ${siteMeta.name}`,
  },
  description: siteMeta.description,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='zh-CN' suppressHydrationWarning>
      <body className='antialiased'>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  )
}
