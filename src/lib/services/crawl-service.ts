import { getJsonFile, updateJsonWithRetry } from '@/lib/github/client'
import { DEFAULT_CRAWL_CONFIG, type CrawlConfig, type CrawlSource, type CrawlLogEntry, type CrawlLogsIndex, type CrawlContinuationMonitor } from '@/types/crawl'
import { getDefaultSources, mergeDefaultSources } from '@/lib/crawl/sources'
import { fetchImages } from '@/lib/crawl/fetcher'
import { createExternalImage, uploadImage } from '@/lib/services/image-service'

const CRAWL_CONFIG_PATH = 'data/crawl-config.json'
const CRAWL_LOGS_PATH = 'data/crawl-logs.json'
const SYSTEM_LOGIN = 'system'
const MAX_LOG_ENTRIES = 200
const CONCURRENCY = 6
const BATCH_SIZE = 5

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
    const base = getBaseConfig(current)
    return { ...base, running: true, runningSince: now }
  })

  let fetched = 0
  let duplicates = 0
  let errors = 0
  const sourceLogs: CrawlLogEntry['sources'] = []
  const startTime = Date.now()

  try {
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
        } else {
          errors++
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

  for (const [index, result] of results.entries()) {
    try {
      const uploadResult = result.kind === 'external'
        ? await createExternalImage({
            filename: result.filename,
            mimeType: result.mimeType,
            uploaderLogin: SYSTEM_LOGIN,
            isPublic: true,
            title: result.title,
            width: result.width,
            height: result.height,
            tags: result.tags,
            sourceProvider: result.sourceProvider,
            sourceId: result.sourceId,
            sourcePageUrl: result.sourcePageUrl,
            sourceCreatedAt: result.sourceCreatedAt,
            externalUrl: result.externalUrl,
            hash: result.uniqueKey,
          })
        : await uploadImage({
            buffer: result.buffer,
            filename: `crawl_${source.id}_${Date.now()}_${index}.${extensionFromMimeType(result.mimeType)}`,
            mimeType: result.mimeType,
            uploaderLogin: SYSTEM_LOGIN,
            isPublic: true,
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

function extensionFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    default:
      return 'jpg'
  }
}
