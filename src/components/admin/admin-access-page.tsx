'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n/context'
import type { AccessLogEntry, AccessLogType, AccessOverview } from '@/types/access'

const TYPE_ORDER: AccessLogType[] = ['page_view', 'random_api', 'images_api', 'image_meta_api']

type Props = {
  overview: AccessOverview
  logs: AccessLogEntry[]
  total: number
  page: number
  pageSize: number
  activeType?: AccessLogType
}

export function AdminAccessPage({ overview, logs, total, page, pageSize, activeType }: Props) {
  const { t, lang } = useLang()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const summaryCards = [
    { label: t.admin.accessTotalHits, value: overview.total },
    { label: t.admin.accessPageViews, value: overview.pageViews },
    { label: t.admin.accessRandomApiCalls, value: overview.randomApiCalls },
    { label: t.admin.accessImagesApiCalls, value: overview.imagesApiCalls },
    { label: t.admin.accessImageMetaCalls, value: overview.imageMetaCalls },
    { label: t.admin.accessUniqueVisitors, value: overview.uniqueVisitors },
    { label: t.admin.accessLoggedInCalls, value: overview.loggedInCalls },
  ]

  const typeLabels: Record<AccessLogType, string> = {
    page_view: t.admin.accessTypePageView,
    random_api: t.admin.accessTypeRandomApi,
    images_api: t.admin.accessTypeImagesApi,
    image_meta_api: t.admin.accessTypeImageMetaApi,
  }

  const roleLabels = {
    guest: t.admin.accessGuestRole,
    user: t.admin.userRole,
    admin: t.admin.adminRole,
  }

  return (
    <div className='space-y-5'>
      <section className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
        <h2 className='font-title text-3xl text-[var(--color-ink)]'>{t.admin.accessLogs}</h2>
        {overview.enabled ? (
          <>
            <p className='mt-2 text-sm text-[var(--color-ink-soft)]'>{t.admin.accessCoverageNote}</p>
            <p className='mt-1 text-xs text-[var(--color-ink-soft)]'>
              {t.admin.accessRetentionNote(overview.retainedLogs, overview.retentionLimit)}
            </p>
          </>
        ) : (
          <p className='mt-2 text-sm text-red-700'>{t.admin.accessDisabledNote}</p>
        )}
      </section>

      <section className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        {summaryCards.map(card => (
          <div key={card.label} className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
            <p className='text-sm text-[var(--color-ink-soft)]'>{card.label}</p>
            <p className='mt-2 font-title text-3xl text-[var(--color-ink)]'>{card.value.toLocaleString(lang === 'en' ? 'en-US' : 'zh-CN')}</p>
          </div>
        ))}
      </section>

      <section className='rounded-2xl border border-white/70 bg-white/60 p-5 backdrop-blur'>
        <div className='mb-4 flex items-center justify-between gap-3'>
          <div>
            <h3 className='font-title text-2xl text-[var(--color-ink)]'>{t.admin.accessTopImages}</h3>
            <p className='text-sm text-[var(--color-ink-soft)]'>
              {overview.enabled ? t.admin.accessCoverageNote : t.admin.accessDisabledNote}
            </p>
          </div>
        </div>

        {overview.topImages.length === 0 ? (
          <p className='py-8 text-center text-sm text-[var(--color-ink-soft)]'>{t.common.noData}</p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-full text-left text-sm'>
              <thead className='text-xs text-[var(--color-ink-soft)]'>
                <tr>
                  <th className='px-3 py-2'>{t.admin.accessImage}</th>
                  <th className='px-3 py-2'>{t.admin.accessImageTotalHits}</th>
                  <th className='px-3 py-2'>{t.admin.accessImageRandomHits}</th>
                  <th className='px-3 py-2'>{t.admin.accessImageMetaHits}</th>
                  <th className='px-3 py-2'>{t.admin.accessLastHit}</th>
                </tr>
              </thead>
              <tbody>
                {overview.topImages.map(image => (
                  <tr key={image.imageId} className='border-t border-white/70'>
                    <td className='px-3 py-2'>
                      <div className='font-medium text-[var(--color-ink)]'>{image.imageTitle || image.imageId}</div>
                      {image.imageTitle && <div className='text-xs text-[var(--color-ink-soft)]'>{image.imageId}</div>}
                    </td>
                    <td className='px-3 py-2 text-[var(--color-ink)]'>{image.totalCount}</td>
                    <td className='px-3 py-2 text-[var(--color-ink)]'>{image.randomCount}</td>
                    <td className='px-3 py-2 text-[var(--color-ink)]'>{image.metaCount}</td>
                    <td className='whitespace-nowrap px-3 py-2 text-[var(--color-ink-soft)]'>
                      {formatDateTime(image.lastAt, lang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className='rounded-2xl border border-white/70 bg-white/60 p-5 backdrop-blur'>
        <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h3 className='font-title text-2xl text-[var(--color-ink)]'>{t.admin.accessLatestRecords}</h3>
            <p className='text-sm text-[var(--color-ink-soft)]'>{t.admin.totalRecords(total)}</p>
          </div>

          <div className='flex flex-wrap gap-2'>
            <Link href={buildHref()} className={filterClass(!activeType)}>
              {t.admin.accessFilterAll}
            </Link>
            {TYPE_ORDER.map(type => (
              <Link key={type} href={buildHref(1, type)} className={filterClass(activeType === type)}>
                {typeLabels[type]}
              </Link>
            ))}
          </div>
        </div>

        {logs.length === 0 ? (
          <p className='py-8 text-center text-sm text-[var(--color-ink-soft)]'>{t.admin.noLogs}</p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-[1200px] text-left text-sm'>
              <thead className='text-xs text-[var(--color-ink-soft)]'>
                <tr>
                  <th className='px-3 py-2'>{t.admin.time}</th>
                  <th className='px-3 py-2'>{t.admin.accessType}</th>
                  <th className='px-3 py-2'>{t.admin.accessCaller}</th>
                  <th className='px-3 py-2'>{t.admin.accessRequest}</th>
                  <th className='px-3 py-2'>{t.admin.accessImage}</th>
                  <th className='px-3 py-2'>{t.admin.accessReferer}</th>
                  <th className='px-3 py-2'>{t.admin.details}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className='border-t border-white/70 align-top'>
                    <td className='whitespace-nowrap px-3 py-2 text-[var(--color-ink-soft)]'>
                      {formatDateTime(log.createdAt, lang)}
                    </td>
                    <td className='px-3 py-2'>
                      <span className='rounded-full bg-[var(--color-bg)] px-2 py-0.5 text-xs text-[var(--color-ink)]'>
                        {typeLabels[log.type]}
                      </span>
                    </td>
                    <td className='px-3 py-2'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span className='rounded-full border border-[var(--color-border-strong)] px-2 py-0.5 text-xs text-[var(--color-ink-soft)]'>
                          {roleLabels[log.actorRole]}
                        </span>
                        <span className='font-medium text-[var(--color-ink)]'>{log.actorLogin || t.admin.accessNoCaller}</span>
                      </div>
                      {log.actorGithubId && (
                        <div className='mt-1 text-xs text-[var(--color-ink-soft)]'>
                          {t.admin.accessGithubId}: {log.actorGithubId}
                        </div>
                      )}
                      {log.visitorKey && (
                        <div className='mt-1 break-all text-xs text-[var(--color-ink-soft)]'>
                          {t.admin.accessVisitorKey}: {log.visitorKey}
                        </div>
                      )}
                    </td>
                    <td className='px-3 py-2'>
                      <div className='font-medium text-[var(--color-ink)]'>
                        {log.method} {log.status}
                      </div>
                      <div className='mt-1 break-all text-xs text-[var(--color-ink-soft)]'>{log.path}</div>
                      <div className='mt-1 text-xs text-[var(--color-ink-soft)]'>
                        {t.admin.accessIp}: {log.ip || '-'}
                      </div>
                      <div className='mt-1 text-xs text-[var(--color-ink-soft)]'>
                        {t.admin.accessDevice}: {formatDevice(log.deviceType, log.browser, log.os)}
                      </div>
                    </td>
                    <td className='px-3 py-2'>
                      {log.imageId ? (
                        <>
                          <div className='font-medium text-[var(--color-ink)]'>{log.imageTitle || log.imageId}</div>
                          <div className='mt-1 break-all text-xs text-[var(--color-ink-soft)]'>{log.imageId}</div>
                        </>
                      ) : (
                        <span className='text-[var(--color-ink-soft)]'>{t.admin.accessNoImage}</span>
                      )}
                    </td>
                    <td className='px-3 py-2'>
                      {log.referer ? (
                        <span className='break-all text-[var(--color-ink-soft)]'>{log.referer}</span>
                      ) : (
                        <span className='text-[var(--color-ink-soft)]'>{t.admin.accessNoReferer}</span>
                      )}
                    </td>
                    <td className='px-3 py-2 text-[var(--color-ink-soft)]'>{log.detail || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className='mt-4 flex items-center justify-end gap-2'>
            <Link
              href={buildHref(Math.max(1, page - 1), activeType)}
              aria-disabled={page <= 1}
              className={page <= 1 ? disabledPagerClass : pagerClass}>
              {t.admin.accessPrevPage}
            </Link>
            <span className='text-sm text-[var(--color-ink-soft)]'>{t.admin.accessPageIndicator(page, totalPages)}</span>
            <Link
              href={buildHref(Math.min(totalPages, page + 1), activeType)}
              aria-disabled={page >= totalPages}
              className={page >= totalPages ? disabledPagerClass : pagerClass}>
              {t.admin.accessNextPage}
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}

function buildHref(page = 1, type?: AccessLogType) {
  const params = new URLSearchParams()
  if (page > 1) params.set('page', String(page))
  if (type) params.set('type', type)
  const query = params.toString()
  return query ? `/admin/access?${query}` : '/admin/access'
}

function filterClass(active: boolean) {
  return active
    ? 'rounded-xl bg-[var(--color-brand)] px-3 py-1.5 text-sm text-white'
    : 'rounded-xl border border-[var(--color-border-strong)] bg-white px-3 py-1.5 text-sm text-[var(--color-ink-soft)] transition hover:text-[var(--color-ink)]'
}

const pagerClass =
  'rounded-xl border border-[var(--color-border-strong)] bg-white px-3 py-1.5 text-sm text-[var(--color-ink-soft)] transition hover:text-[var(--color-ink)]'

const disabledPagerClass =
  'pointer-events-none rounded-xl border border-[var(--color-border-strong)] bg-white/60 px-3 py-1.5 text-sm text-[var(--color-ink-soft)] opacity-50'

function formatDateTime(value: string, lang: 'zh' | 'en') {
  return new Date(value).toLocaleString(lang === 'en' ? 'en-US' : 'zh-CN')
}

function formatDevice(deviceType: string, browser?: string, os?: string) {
  const extras = [browser, os].filter(Boolean).join(' / ')
  return extras ? `${deviceType} · ${extras}` : deviceType
}
