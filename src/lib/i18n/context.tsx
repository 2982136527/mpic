'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import zh from './zh'
import en from './en'

export type Lang = 'zh' | 'en'

const translations = { zh, en }

type I18nContextType = {
  lang: Lang
  t: typeof zh
  setLang: (lang: Lang) => void
}

const I18nContext = createContext<I18nContextType>({
  lang: 'zh',
  t: zh,
  setLang: () => {},
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('zh')

  useEffect(() => {
    const stored = localStorage.getItem('mpic-lang') as Lang | null
    if (stored === 'zh' || stored === 'en') {
      setLangState(stored)
    }
  }, [])

  const setLang = (newLang: Lang) => {
    setLangState(newLang)
    localStorage.setItem('mpic-lang', newLang)
  }

  return (
    <I18nContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useLang() {
  return useContext(I18nContext)
}
