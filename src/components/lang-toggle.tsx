'use client'

import { useLang } from '@/lib/i18n/context'

export function LangToggle() {
  const { lang, setLang } = useLang()

  return (
    <button
      type='button'
      onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
      className='rounded-full border border-[var(--glass-border-strong)] bg-[var(--glass-bg-strong)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] shadow-sm transition hover:text-[var(--color-ink)]'>
      {lang === 'zh' ? '中 / EN' : 'EN / 中'}
    </button>
  )
}
