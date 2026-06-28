import { after } from 'next/server'
import { updateCrawlContinuation } from '@/lib/services/crawl-service'

const CONTINUE_RETRY_DELAYS_MS = [2000, 8000, 20000, 45000]

type TriggerResult = {
  accepted: boolean
  retryable: boolean
  detail: string
}

function getContinuationUrls(requestUrl: string): string[] {
  const urls = new Set<string>()
  urls.add(new URL('/api/cron/crawl', requestUrl).toString())

  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '')
  if (configuredSiteUrl) {
    urls.add(new URL('/api/cron/crawl', configuredSiteUrl).toString())
  }

  return Array.from(urls)
}

async function tryTrigger(url: string, cronSecret?: string): Promise<TriggerResult> {
  const response = await fetch(url, {
    headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {},
    cache: 'no-store',
  })

  const text = await response.text()
  const snippet = text.slice(0, 200)

  if (!response.ok) {
    return {
      accepted: false,
      retryable: true,
      detail: `HTTP ${response.status} ${response.statusText}${snippet ? ` body=${snippet}` : ''}`,
    }
  }

  let payload: { ok?: boolean; fetched?: number; duplicates?: number; errors?: number } | undefined
  try {
    payload = text ? (JSON.parse(text) as { ok?: boolean; fetched?: number; duplicates?: number; errors?: number }) : undefined
  } catch {
    payload = undefined
  }

  if (payload?.ok === true) {
    const fetched = payload.fetched ?? 0
    const duplicates = payload.duplicates ?? 0
    const errors = payload.errors ?? 0

    if (fetched === 0 && duplicates === 0 && errors === 0) {
      return {
        accepted: false,
        retryable: true,
        detail: 'Accepted by route but skipped with fetched=0 duplicates=0 errors=0',
      }
    }

    return {
      accepted: true,
      retryable: false,
      detail: `accepted fetched=${fetched} duplicates=${duplicates} errors=${errors}`,
    }
  }

  return {
    accepted: false,
    retryable: true,
    detail: `Unexpected 200 response${snippet ? ` body=${snippet}` : ''}`,
  }
}

export function scheduleNextCrawl(requestUrl: string, cronSecret: string | undefined, logPrefix: string) {
  const urls = getContinuationUrls(requestUrl)

  after(async () => {
    let lastDetail = 'no attempts made'
    let lastUrl = urls[0] || ''
    const scheduledAt = new Date().toISOString()

    await updateCrawlContinuation({
      lastScheduledAt: scheduledAt,
      lastStatus: 'scheduled',
      lastDetail: `Queued continuation across ${urls.length} target(s)`,
    }).catch(() => {})

    for (const url of urls) {
      for (const delay of CONTINUE_RETRY_DELAYS_MS) {
        try {
          await new Promise(resolve => setTimeout(resolve, delay))
          const result = await tryTrigger(url, cronSecret)
          lastUrl = url
          lastDetail = `${url} -> ${result.detail}`

          if (result.accepted) {
            const acceptedAt = new Date().toISOString()
            await updateCrawlContinuation({
              lastAttemptAt: acceptedAt,
              lastAcceptedAt: acceptedAt,
              lastStatus: 'accepted',
              lastDetail,
              lastUrl: url,
            }).catch(() => {})
            return
          }

          if (!result.retryable) {
            break
          }
        } catch (error) {
          lastUrl = url
          lastDetail = `${url} -> ${error instanceof Error ? error.message : String(error)}`
        }
      }
    }

    await updateCrawlContinuation({
      lastAttemptAt: new Date().toISOString(),
      lastStatus: 'failed',
      lastDetail,
      lastUrl,
    }).catch(() => {})

    console.error(logPrefix, { urls, lastDetail })
  })
}
