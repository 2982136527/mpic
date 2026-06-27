import { getJsonFile, updateJsonWithRetry } from '@/lib/github/client'
import { DEFAULT_CRAWL_CONFIG, type CrawlConfig, type CrawlSource, type CrawlLogEntry, type CrawlLogsIndex } from '@/types/crawl'
import { getDefaultSources } from '@/lib/crawl/sources'
import { fetchImage } from '@/lib/crawl/fetcher'
import { uploadImage } from '@/lib/services/image-service'

const CRAWL_CONFIG_PATH = 'data/crawl-config.json'
const CRAWL_LOGS_PATH = 'data/crawl-logs.json'
const SYSTEM_LOGIN = 'system'
const MAX_LOG_ENTRIES = 200
const CONCURRENCY = 3

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

export async function getCrawlLogs(): Promise<CrawlLogEntry[]> {
  const file = await getJsonFile<CrawlLogsIndex>(CRAWL_LOGS_PATH)
  if (!file) return []
  return file.data.logs.slice(0, 50)
}

export async function runCrawl(force = false): Promise<{ fetched: number; duplicates: number; errors: number; shouldContinue: boolean }> {
  const config = await getCrawlConfig()

  // Skip if already running (with 10 min timeout safety)
  if (config.running && config.runningSince) {
    const runningFor = Date.now() - new Date(config.runningSince).getTime()
    if (runningFor < 10 * 60 * 1000) {
      return { fetched: 0, duplicates: 0, errors: 0, shouldContinue: false }
    }
  }

  if (!config.enabled && !force) {
    return { fetched: 0, duplicates: 0, errors: 0, shouldContinue: false }
  }

  const enabledSources = config.sources.filter(s => s.enabled)
  if (enabledSources.length === 0) {
    return { fetched: 0, duplicates: 0, errors: 0, shouldContinue: false }
  }

  // Mark as running
  const now = new Date().toISOString()
  await updateJsonWithRetry<CrawlConfig>(CRAWL_CONFIG_PATH, current => {
    const base = current || { ...DEFAULT_CRAWL_CONFIG, sources: getDefaultSources() }
    return { ...base, running: true, runningSince: now }
  })

  let fetched = 0
  let duplicates = 0
  let errors = 0
  const sourceLogs: CrawlLogEntry['sources'] = []
  const startTime = Date.now()

  // Process sources with concurrency limit, 1 image per source
  for (let i = 0; i < enabledSources.length; i += CONCURRENCY) {
    const batch = enabledSources.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map(source => processSource(source)),
    )
    for (let j = 0; j < results.length; j++) {
      const result = results[j]
      const source = batch[j]
      if (result.status === 'fulfilled') {
        fetched += result.value.fetched
        duplicates += result.value.duplicates
        errors += result.value.errors
        sourceLogs.push({ name: source.name, ...result.value })
      } else {
        errors++
        sourceLogs.push({ name: source.name, fetched: 0, duplicates: 0, errors: 1 })
      }
    }
  }

  const duration = Date.now() - startTime

  // Update lastRunAt and clear running flag
  await updateJsonWithRetry<CrawlConfig>(CRAWL_CONFIG_PATH, current => {
    const base = current || { ...DEFAULT_CRAWL_CONFIG, sources: getDefaultSources() }
    return { ...base, lastRunAt: new Date().toISOString(), running: false, runningSince: undefined }
  })

  // Append crawl log
  const logEntry: CrawlLogEntry = {
    id: crypto.randomUUID().slice(0, 8),
    startedAt: new Date(startTime).toISOString(),
    duration,
    fetched,
    duplicates,
    errors,
    sources: sourceLogs,
  }

  await updateJsonWithRetry<CrawlLogsIndex>(CRAWL_LOGS_PATH, current => {
    const index = current || { version: 1, logs: [] }
    index.logs.unshift(logEntry)
    if (index.logs.length > MAX_LOG_ENTRIES) {
      index.logs = index.logs.slice(0, MAX_LOG_ENTRIES)
    }
    return index
  })

  // Continue if still enabled and got some results
  const shouldContinue = config.enabled && (fetched > 0 || duplicates > 0)

  return { fetched, duplicates, errors, shouldContinue }
}

async function processSource(source: CrawlSource): Promise<{ fetched: number; duplicates: number; errors: number }> {
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

    return { fetched: isDuplicate ? 0 : 1, duplicates: isDuplicate ? 1 : 0, errors: 0 }
  } catch {
    return { fetched: 0, duplicates: 0, errors: 1 }
  }
}
