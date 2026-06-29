'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLang } from '@/lib/i18n/context'

type TimelineItem = {
  yearMonth: string
  count: number
  days: { day: string; count: number }[]
}

type Props = {
  timeline: TimelineItem[]
  current: string
  date: string
}

const WEEKDAYS_SHORT = ['一', '二', '三', '四', '五', '六', '日']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay()
}

function buildDaySet(timeline: TimelineItem[]) {
  const set = new Set<string>()
  for (const month of timeline) {
    for (const day of month.days) {
      set.add(day.day)
    }
  }
  return set
}

export function TimelineBar({ timeline, current, date }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const { t } = useLang()

  const daySet = useMemo(() => buildDaySet(timeline), [timeline])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      if (date && date.length >= 7) {
        setSelectedMonth(date.slice(0, 7))
      } else if (date) {
        setSelectedMonth(date)
      } else {
        setSelectedMonth(null)
      }
    }
  }, [open, date, timeline])

  const handleSelectDay = (day: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('date', day)
    params.delete('yearMonth')
    params.delete('page')
    router.push(`/?${params.toString()}`)
    setOpen(false)
  }

  const handleSelectMonth = (ym: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('date', ym)
    params.delete('yearMonth')
    params.delete('page')
    router.push(`/?${params.toString()}`)
    setOpen(false)
  }

  const handleClear = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('date')
    params.delete('yearMonth')
    params.delete('page')
    router.push(`/?${params.toString()}`)
    setOpen(false)
  }

  const formatYearMonth = (ym: string) => {
    const [year, month] = ym.split('-')
    return t.gallery.yearMonth(year, month)
  }

  const formatDayShort = (day: string) => {
    const [, month, d] = day.split('-')
    return `${parseInt(month)}月${parseInt(d)}日`
  }

  if (timeline.length === 0) return null

  let currentLabel: string
  let currentCount: number
  if (date && date.length > 7) {
    const ym = date.slice(0, 7)
    const monthItem = timeline.find(item => item.yearMonth === ym)
    const dayItem = monthItem?.days.find(d => d.day === date)
    currentLabel = formatDayShort(date)
    currentCount = dayItem?.count || 0
  } else if (date) {
    const item = timeline.find(item => item.yearMonth === date)
    currentLabel = formatYearMonth(date)
    currentCount = item?.count || 0
  } else {
    currentLabel = t.gallery.allTime
    currentCount = timeline.reduce((s, item) => s + item.count, 0)
  }

  const totalCount = timeline.reduce((s, item) => s + item.count, 0)

  // Build calendar for the selected month
  const calendar = selectedMonth
    ? (() => {
        const [y, m] = selectedMonth.split('-').map(Number)
        const daysInMonth = getDaysInMonth(y, m)
        const firstDay = getFirstDayOfWeek(y, m)
        // Monday-first offset: Sun=0 becomes 6, Mon=1 becomes 0, etc.
        const startOffset = firstDay === 0 ? 6 : firstDay - 1
        const cells: ({ day: number; hasImage: boolean; dateStr: string } | null)[] = []
        for (let i = 0; i < startOffset; i++) cells.push(null)
        for (let d = 1; d <= daysInMonth; d++) {
          const ds = `${selectedMonth}-${String(d).padStart(2, '0')}`
          cells.push({ day: d, hasImage: daySet.has(ds), dateStr: ds })
        }
        return { year: y, month: m, cells }
      })()
    : null

  return (
    <div className={`relative mb-4 ${open ? 'z-50' : 'z-10'}`} ref={ref}>
      <button
        type='button'
        onClick={() => setOpen(!open)}
        className='flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-white/80 px-4 py-2 text-sm font-medium text-[var(--color-ink)] shadow-sm transition hover:border-[var(--color-brand)] hover:shadow-md'>
        <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
          <rect x='3' y='4' width='18' height='18' rx='2' ry='2' />
          <line x1='16' y1='2' x2='16' y2='6' />
          <line x1='8' y1='2' x2='8' y2='6' />
          <line x1='3' y1='10' x2='21' y2='10' />
        </svg>
        {currentLabel}
        <span className='text-xs text-[var(--color-ink-soft)]'>{currentCount} {t.gallery.countImages}</span>
        <svg className={`ml-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
          <polyline points='6 9 12 15 18 9' />
        </svg>
      </button>

      {open && (
        <div
          className='absolute left-0 top-full z-[60] mt-2 flex w-[36rem] origin-top-left overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-white/95 shadow-xl backdrop-blur-xl'
          style={{ animation: 'jelly-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
          {/* Left: month list */}
          <div className='w-2/5 border-r border-[var(--color-border-strong)] p-1.5 overflow-y-auto max-h-80'>
            <button
              type='button'
              onClick={handleClear}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[var(--color-brand)]/10 ${
                !date ? 'bg-[var(--color-brand)]/10 font-medium text-[var(--color-brand)]' : 'text-[var(--color-ink)]'
              }`}>
              <span>{t.gallery.allTime}</span>
              <span className='text-xs text-[var(--color-ink-soft)]'>{totalCount}</span>
            </button>
            {timeline.map(item => (
              <button
                key={item.yearMonth}
                type='button'
                onClick={() => setSelectedMonth(item.yearMonth)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[var(--color-brand)]/10 ${
                  selectedMonth === item.yearMonth ? 'bg-[var(--color-brand)]/10 font-medium text-[var(--color-brand)]' : 'text-[var(--color-ink)]'
                }`}>
                <span>{formatYearMonth(item.yearMonth)}</span>
                <span className='text-xs text-[var(--color-ink-soft)]'>{item.count}</span>
              </button>
            ))}
          </div>

          {/* Right: calendar */}
          {calendar && (
            <div className='w-3/5 p-4 overflow-y-auto max-h-80'>
              <>
                <div className='mb-3 text-sm font-semibold text-[var(--color-ink)]'>
                  {calendar.year}年{calendar.month}月
                </div>
                <div className='grid grid-cols-7 gap-0.5'>
                  {WEEKDAYS_SHORT.map(wd => (
                    <div key={wd} className='py-1 text-center text-[11px] font-medium text-[var(--color-ink-soft)]'>
                      {wd}
                    </div>
                  ))}
                  {calendar.cells.map((cell, i) =>
                    cell ? (
                      <button
                        key={i}
                        type='button'
                        onClick={() => cell.hasImage && handleSelectDay(cell.dateStr)}
                        disabled={!cell.hasImage}
                        className={`relative rounded-lg py-1.5 text-center text-sm leading-none transition ${
                          date === cell.dateStr
                            ? 'z-10 bg-[var(--color-brand)] font-semibold text-white shadow-sm'
                            : cell.hasImage
                              ? 'cursor-pointer text-[var(--color-ink)] hover:bg-[var(--color-brand)]/10'
                              : 'cursor-default text-[var(--color-ink-soft)]/30'
                        }`}>
                        {cell.day}
                      </button>
                    ) : (
                      <div key={i} />
                    ),
                  )}
                </div>
                <button
                  type='button'
                  onClick={() => handleSelectMonth(selectedMonth!)}
                  className='mt-3 w-full rounded-lg border border-dashed border-[var(--color-border-strong)] py-1.5 text-xs text-[var(--color-ink-soft)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]'>
                  查看全部 {calendar.month} 月
                </button>
              </>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
