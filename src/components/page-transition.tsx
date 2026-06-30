'use client'

import { type ReactNode } from 'react'
import { useLang } from '@/lib/i18n/context'

export function PageTransition({ children }: { children: ReactNode }) {
  const { animPhase } = useLang()

  const animClass =
    animPhase === 'exiting'
      ? 'animate-fade-out-up'
      : animPhase === 'entering'
        ? 'animate-fade-in-up-short'
        : ''

  return <div className={animClass}>{children}</div>
}
