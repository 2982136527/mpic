'use client'

import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import zh from './zh'
import en from './en'

export type Lang = 'zh' | 'en'
export type AnimPhase = 'idle' | 'exiting' | 'entering'

const translations = { zh, en }

type I18nContextType = {
  lang: Lang
  t: typeof zh
  setLang: (lang: Lang) => void
  animPhase: AnimPhase
}

const EXIT_DURATION = 180
const ENTER_DURATION = 400

const I18nContext = createContext<I18nContextType>({
  lang: 'zh',
  t: zh,
  setLang: () => {},
  animPhase: 'idle',
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [displayLang, setDisplayLang] = useState<Lang>('zh')
  const [animPhase, setAnimPhase] = useState<AnimPhase>('idle')
  const pendingLangRef = useRef<Lang>('zh')

  useEffect(() => {
    const stored = localStorage.getItem('mpic-lang') as Lang | null
    if (stored === 'zh' || stored === 'en') {
      setDisplayLang(stored)
      pendingLangRef.current = stored
    }
  }, [])

  useEffect(() => {
    if (animPhase === 'exiting') {
      const timer = setTimeout(() => {
        setDisplayLang(pendingLangRef.current)
        setAnimPhase('entering')
      }, EXIT_DURATION)
      return () => clearTimeout(timer)
    }
    if (animPhase === 'entering') {
      const timer = setTimeout(() => {
        setAnimPhase('idle')
      }, ENTER_DURATION)
      return () => clearTimeout(timer)
    }
  }, [animPhase])

  const setLang = useCallback((newLang: Lang) => {
    if (newLang === displayLang || animPhase !== 'idle') return
    pendingLangRef.current = newLang
    localStorage.setItem('mpic-lang', newLang)
    setAnimPhase('exiting')
  }, [displayLang, animPhase])

  return (
    <I18nContext.Provider value={{ lang: displayLang, t: translations[displayLang], setLang, animPhase }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useLang() {
  return useContext(I18nContext)
}
