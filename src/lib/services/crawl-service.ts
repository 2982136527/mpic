import { getJsonFile, getPublicJsonFile, updateJsonWithRetry } from '@/lib/github/client'
import { DEFAULT_CRAWL_CONFIG, type CrawlConfig, type CrawlSource, type CrawlLogEntry, type CrawlLogsIndex, type CrawlContinuationMonitor } from '@/types/crawl'
import { getDefaultSources, mergeDefaultSources } from '@/lib/crawl/sources'
import { fetchImages } from '@/lib/crawl/fetcher'
import { mirrorExternalPixivImages, uploadImage } from '@/lib/services/image-service'

const CRAWL_CONFIG_PATH = 'data/crawl-config.json'
const CRAWL_LOGS_PATH = 'data/crawl-logs.json'
const SYSTEM_LOGIN = 'system'
const MAX_LOG_ENTRIES = 200
const CONCURRENCY = 6
const BATCH_SIZE = 50

function getBaseConfig(current?: CrawlConfig): CrawlConfig {
  const base = { ...DEFAULT_CRAWL_CONFIG, ...(current || {}) }
  base.sources = mergeDefaultSources(base.sources || [])
  return base
}

export async function getCrawlConfig(): Promise<CrawlConfig> {
  const file = await getJsonFile<CrawlConfig>(CRAWL_CONFIG_PATH)
  if (!file) {
    const defaults = { ...DEFAULT_CRAWL_CONFIG, sources: getDefaultSources() }
    return defaults
  }
  return getBaseConfig(file.data)
}

export async function updateCrawlConfig(changes: Partial<CrawlConfig>): Promise<CrawlConfig> {
  await updateJsonWithRetry<CrawlConfig>(CRAWL_CONFIG_PATH, current => {
    const base = getBaseConfig(current)
    return { ...base, ...changes, version: 1 }
  })
  return getCrawlConfig()
}

export async function updateCrawlContinuation(changes: Partial<CrawlContinuationMonitor>): Promise<void> {
  await updateJsonWithRetry<CrawlConfig>(CRAWL_CONFIG_PATH, current => {
    const base = getBaseConfig(current)
    return {
      ...base,
      continuation: {
        ...base.continuation,
        ...changes,
      },
    }
  })
}

export async function getCrawlLogs(): Promise<CrawlLogEntry[]> {
  const data = await getPublicJsonFile<CrawlLogsIndex>(CRAWL_LOGS_PATH)
  if (!data) return []
  return data.logs.slice(0, 50)
}

export async function runCrawl(force = false): Promise<{ fetched: number; duplicates: number; errors: number; shouldContinue: boolean }> {
  const config = await getCrawlConfig()

  // Skip if already running (with 10 min timeout safety and stale flag recovery)
  if (config.running && config.runningSince && !force) {
    const runningFor = Date.now() - new Date(config.runningSince).getTime()
    const staleThreshold = 10 * 60 * 1000

    if (runningFor < staleThreshold) {
      // Check if this is a genuine run-in-progress or a stale flag
      // Stale detection: runningSince is much newer than lastRunAt (flag was set but lastRunAt never updated)
      const lastCompletedRunAt = config.lastRunAt ? new Date(config.lastRunAt).getTime() : 0
      const staleMargin = 30_000 // 30s buffer
      if (lastCompletedRunAt > 0 && new Date(config.runningSince).getTime() - lastCompletedRunAt > staleMargin) {
        // runningSince is newer than lastRunAt — flag was set by a run that never completed
        console.warn(`[crawl] detected stale running flag: runningSince=${config.runningSince} lastRunAt=${config.lastRunAt}, recovering`)
        // Auto-clear the stale flag so this run can proceed (fall through to continue)
        await updateJsonWithRetry<CrawlConfig>(CRAWL_CONFIG_PATH, current => {
          const base = getBaseConfig(current)
          return { ...base, running: false, runningSince: undefined }
        }).catch(() => {})
      } else {
        return { fetched: 0, duplicates: 0, errors: 0, shouldContinue: false }
      }
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
    const base = getBaseConfig(current)
    return { ...base, running: true, runningSince: now }
  })

  let fetched = 0
  let duplicates = 0
  let errors = 0
  const sourceLogs: CrawlLogEntry['sources'] = []
  const startTime = Date.now()

  try {
    await mirrorExternalPixivImages(BATCH_SIZE * 2).catch(() => {})

    // Process sources with concurrency limit, 5 images per source
    for (let i = 0; i < enabledSources.length; i += CONCURRENCY) {
      const batch = enabledSources.slice(i, i + CONCURRENCY)
      const results = await Promise.allSettled(
        batch.map(source => processSource(source, BATCH_SIZE)),
      )
      for (let j = 0; j < results.length; j++) {
        const result = results[j]
        const source = batch[j]
        if (result.status === 'fulfilled') {
          fetched += result.value.fetched
          duplicates += result.value.duplicates
          errors += result.value.errors
          sourceLogs.push({ name: source.name, ...result.value })
          if (result.value.errors > 0) {
            console.log(`[crawl] source=${source.name} fetched=${result.value.fetched} duplicates=${result.value.duplicates} errors=${result.value.errors}`)
          }
        } else {
          errors++
          console.warn(`[crawl] source=${source.name} failed: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`)
          sourceLogs.push({ name: source.name, fetched: 0, duplicates: 0, errors: 1 })
        }
      }
    }
  } finally {
    const duration = Date.now() - startTime

    // Always clear running flag, even on error
    await updateJsonWithRetry<CrawlConfig>(CRAWL_CONFIG_PATH, current => {
      const base = getBaseConfig(current)
      return { ...base, lastRunAt: new Date().toISOString(), running: false, runningSince: undefined }
    }).catch(() => {})

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
    }).catch(() => {})
  }

  // Continue if still enabled
  return { fetched, duplicates, errors, shouldContinue: config.enabled }
}

async function processSource(source: CrawlSource, batchSize: number): Promise<{ fetched: number; duplicates: number; errors: number }> {
  let fetched = 0
  let duplicates = 0
  let errors = 0

  const results = await fetchImages(source, batchSize)

  for (const result of results) {
    try {
      const uploadResult = await uploadImage({
        buffer: result.buffer,
        filename: result.filename,
        mimeType: result.mimeType,
        uploaderLogin: SYSTEM_LOGIN,
        isPublic: true,
        title: result.title,
        tags: result.tags,
        sourceProvider: result.sourceProvider,
        sourceId: result.sourceId,
        sourcePageUrl: result.sourcePageUrl,
        sourceCreatedAt: result.sourceCreatedAt,
      })

      if (uploadResult.isDuplicate) {
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
