import { getJsonFile, updateJsonWithRetry } from '@/lib/github/client'
import { DEFAULT_CRAWL_CONFIG, type CrawlConfig, type CrawlSource } from '@/types/crawl'
import { getDefaultSources } from '@/lib/crawl/sources'
import { fetchImage } from '@/lib/crawl/fetcher'
import { uploadImage } from '@/lib/services/image-service'
import { appendLog } from '@/lib/services/log-service'

const CRAWL_CONFIG_PATH = 'data/crawl-config.json'
const SYSTEM_LOGIN = 'system'

export async function getCrawlConfig(): Promise<CrawlConfig> {
  const file = await getJsonFile<CrawlConfig>(CRAWL_CONFIG_PATH)
  if (!file) {
    const defaults = { ...DEFAULT_CRAWL_CONFIG, sources: getDefaultSources() }
    return defaults
  }
  const config = { ...DEFAULT_CRAWL_CONFIG, ...file.data }
  if (config.sources.length === 0) {
    config.sources = getDefaultSources()
  }
  return config
}

export async function updateCrawlConfig(changes: Partial<CrawlConfig>): Promise<CrawlConfig> {
  await updateJsonWithRetry<CrawlConfig>(CRAWL_CONFIG_PATH, current => {
    const base = current || { ...DEFAULT_CRAWL_CONFIG, sources: getDefaultSources() }
    return { ...base, ...changes, version: 1 }
  })
  return getCrawlConfig()
}

export async function runCrawl(force = false): Promise<{ fetched: number; duplicates: number; errors: number }> {
  const config = await getCrawlConfig()

  if (!config.enabled && !force) {
    return { fetched: 0, duplicates: 0, errors: 0 }
  }

  // Check interval (skip if forced)
  if (!force && config.lastRunAt) {
    const elapsed = Date.now() - new Date(config.lastRunAt).getTime()
    if (elapsed < config.intervalMinutes * 60 * 1000) {
      return { fetched: 0, duplicates: 0, errors: 0 }
    }
  }

  const enabledSources = config.sources.filter(s => s.enabled)
  if (enabledSources.length === 0) {
    return { fetched: 0, duplicates: 0, errors: 0 }
  }

  let fetched = 0
  let duplicates = 0
  let errors = 0

  // Process sources with concurrency limit
  const CONCURRENCY = 3
  for (let i = 0; i < enabledSources.length; i += CONCURRENCY) {
    const batch = enabledSources.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map(source => processSource(source, config.batchSize)),
    )
    for (const result of results) {
      if (result.status === 'fulfilled') {
        fetched += result.value.fetched
        duplicates += result.value.duplicates
        errors += result.value.errors
      } else {
        errors += config.batchSize
      }
    }
  }

  // Update lastRunAt
  await updateJsonWithRetry<CrawlConfig>(CRAWL_CONFIG_PATH, current => {
    const base = current || { ...DEFAULT_CRAWL_CONFIG, sources: getDefaultSources() }
    return { ...base, lastRunAt: new Date().toISOString() }
  })

  await appendLog({
    action: 'crawl.run',
    actorLogin: SYSTEM_LOGIN,
    detail: `fetched=${fetched} duplicates=${duplicates} errors=${errors}`,
  })

  return { fetched, duplicates, errors }
}

async function processSource(
  source: CrawlSource,
  batchSize: number,
): Promise<{ fetched: number; duplicates: number; errors: number }> {
  let fetched = 0
  let duplicates = 0
  let errors = 0

  for (let i = 0; i < batchSize; i++) {
    try {
      const result = await fetchImage(source)
      const ext = result.mimeType.split('/')[1] || 'jpg'
      const filename = `crawl_${source.id}_${Date.now()}.${ext}`

      const { isDuplicate } = await uploadImage({
        buffer: result.buffer,
        filename,
        mimeType: result.mimeType,
        uploaderLogin: SYSTEM_LOGIN,
        isPublic: true,
      })

      if (isDuplicate) {
        duplicates++
      } else {
        fetched++
      }
    } catch {
      errors++
    }
  }

  return { fetched, duplicates, errors }
}
