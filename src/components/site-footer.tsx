import { SiteFooterText } from '@/components/site-footer-text'

export function SiteFooter() {
  return (
    <footer className='fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border-strong)]/50 bg-white/70 backdrop-blur-md'>
      <div className='mx-auto w-full max-w-6xl px-5 py-3 text-center text-xs text-[var(--color-ink-soft)] sm:px-8'>
        <SiteFooterText />
      </div>
    </footer>
  )
}
