import { after } from 'next/server'

const CONTINUE_RETRY_DELAYS_MS = [0, 1500, 5000]

function getContinuationUrls(requestUrl: string): string[] {
  const urls = new Set<string>()
  urls.add(new URL('/api/cron/crawl', requestUrl).toString())

  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '')
  if (configuredSiteUrl) {
    urls.add(new URL('/api/cron/crawl', configuredSiteUrl).toString())
  }

  return Array.from(urls)
}

async function tryTrigger(url: string, cronSecret?: string): Promise<boolean> {
  const response = await fetch(url, {
    headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {},
    cache: 'no-store',
  })
  return response.ok
}

export function scheduleNextCrawl(requestUrl: string, cronSecret: string | undefined, logPrefix: string) {
  const urls = getContinuationUrls(requestUrl)

  after(async () => {
    let lastError: unknown

    for (const url of urls) {
      for (const delay of CONTINUE_RETRY_DELAYS_MS) {
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        try {
          if (await tryTrigger(url, cronSecret)) {
            return
          }
          lastError = new Error(`Non-OK response from ${url}`)
        } catch (error) {
          lastError = error
        }
      }
    }

    console.error(logPrefix, { urls, lastError })
  })
}
