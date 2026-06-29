import { SiteFooterText } from '@/components/site-footer-text'

export function SiteFooter() {
  return (
    <footer className='mx-auto w-full max-w-6xl px-5 pb-8 pt-12 sm:px-8'>
      <div className='text-center text-xs text-[var(--color-ink-soft)]'>
        <SiteFooterText />
      </div>
    </footer>
  )
}
