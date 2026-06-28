export type CrawlSource = {
  id: string
  name: string
  url: string
  category: 'anime' | 'real'
  enabled: boolean
  responseType: 'redirect' | 'json' | 'direct'
  jsonPath?: string
}

export type CrawlContinuationStatus = 'scheduled' | 'accepted' | 'failed'

export type CrawlContinuationMonitor = {
  lastScheduledAt?: string
  lastAttemptAt?: string
  lastAcceptedAt?: string
  lastStatus?: CrawlContinuationStatus
  lastDetail?: string
  lastUrl?: string
}

export type CrawlConfig = {
  version: 1
  enabled: boolean
  sources: CrawlSource[]
  lastRunAt?: string
  running?: boolean
  runningSince?: string
  continuation?: CrawlContinuationMonitor
}

export const DEFAULT_CRAWL_CONFIG: CrawlConfig = {
  version: 1,
  enabled: false,
  sources: [],
}

export type CrawlLogEntry = {
  id: string
  startedAt: string
  duration: number
  fetched: number
  duplicates: number
  errors: number
  sources: { name: string; fetched: number; duplicates: number; errors: number }[]
}

export type CrawlLogsIndex = {
  version: 1
  logs: CrawlLogEntry[]
}
