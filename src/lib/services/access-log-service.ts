import { getJsonFile, updateJsonWithRetry } from '@/lib/github/client'
import type { AccessImageCounter, AccessLogEntry, AccessLogsIndex, AccessLogType, AccessOverview } from '@/types/access'

const ACCESS_LOGS_PATH = 'data/access-logs.json'
const MAX_ACCESS_LOGS = 2000
const MAX_IMAGE_COUNTERS = 500

function emptyIndex(): AccessLogsIndex {
  return {
    version: 1,
    logs: [],
    counters: {
      total: 0,
      byType: {},
      images: [],
    },
  }
}

export async function appendAccessLog(entry: Omit<AccessLogEntry, 'id' | 'createdAt'>): Promise<void> {
  await updateJsonWithRetry<AccessLogsIndex>(ACCESS_LOGS_PATH, current => {
    const index = current || emptyIndex()
    const createdAt = new Date().toISOString()

    index.logs.unshift({
      ...entry,
      id: crypto.randomUUID().slice(0, 8),
      createdAt,
    })
    index.logs = index.logs.slice(0, MAX_ACCESS_LOGS)

    index.counters.total += 1
    index.counters.byType[entry.type] = (index.counters.byType[entry.type] || 0) + 1

    if (entry.imageId) {
      upsertImageCounter(index.counters.images, {
        imageId: entry.imageId,
        imageTitle: entry.imageTitle,
        totalCount: 1,
        randomCount: entry.type === 'random_api' ? 1 : 0,
        metaCount: entry.type === 'image_meta_api' ? 1 : 0,
        lastAt: createdAt,
      })
    }

    return index
  })
}

export async function listAccessLogs(params: { page?: number; pageSize?: number; type?: AccessLogType } = {}) {
  const { page = 1, pageSize = 100, type } = params
  const file = await getJsonFile<AccessLogsIndex>(ACCESS_LOGS_PATH)
  if (!file) return { logs: [], total: 0 }

  const filtered = type ? file.data.logs.filter(log => log.type === type) : file.data.logs
  const start = (page - 1) * pageSize
  return {
    logs: filtered.slice(start, start + pageSize),
    total: filtered.length,
  }
}

export async function getAccessOverview(): Promise<AccessOverview> {
  const file = await getJsonFile<AccessLogsIndex>(ACCESS_LOGS_PATH)
  if (!file) {
    return {
      total: 0,
      pageViews: 0,
      randomApiCalls: 0,
      imagesApiCalls: 0,
      imageMetaCalls: 0,
      uniqueVisitors: 0,
      loggedInCalls: 0,
      retainedLogs: 0,
      retentionLimit: MAX_ACCESS_LOGS,
      topImages: [],
    }
  }

  const { counters, logs } = file.data
  const uniqueVisitors = new Set(logs.map(log => log.visitorKey).filter(Boolean)).size
  const loggedInCalls = logs.filter(log => log.actorRole !== 'guest').length

  return {
    total: counters.total,
    pageViews: counters.byType.page_view || 0,
    randomApiCalls: counters.byType.random_api || 0,
    imagesApiCalls: counters.byType.images_api || 0,
    imageMetaCalls: counters.byType.image_meta_api || 0,
    uniqueVisitors,
    loggedInCalls,
    retainedLogs: logs.length,
    retentionLimit: MAX_ACCESS_LOGS,
    topImages: [...counters.images]
      .sort((a, b) => {
        const byCount = b.totalCount - a.totalCount
        if (byCount !== 0) return byCount
        return b.lastAt.localeCompare(a.lastAt)
      })
      .slice(0, 20),
  }
}

function upsertImageCounter(counters: AccessImageCounter[], incoming: AccessImageCounter) {
  const existing = counters.find(counter => counter.imageId === incoming.imageId)
  if (existing) {
    existing.imageTitle = incoming.imageTitle || existing.imageTitle
    existing.totalCount += incoming.totalCount
    existing.randomCount += incoming.randomCount
    existing.metaCount += incoming.metaCount
    existing.lastAt = incoming.lastAt
  } else {
    counters.push(incoming)
  }

  counters.sort((a, b) => {
    const byCount = b.totalCount - a.totalCount
    if (byCount !== 0) return byCount
    return b.lastAt.localeCompare(a.lastAt)
  })

  if (counters.length > MAX_IMAGE_COUNTERS) {
    counters.length = MAX_IMAGE_COUNTERS
  }
}
