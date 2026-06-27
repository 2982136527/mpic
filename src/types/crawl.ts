export type CrawlSource = {
  id: string
  name: string
  url: string
  category: 'anime' | 'real'
  enabled: boolean
  responseType: 'redirect' | 'json' | 'direct'
  jsonPath?: string
}

export type CrawlConfig = {
  version: 1
  enabled: boolean
  intervalMinutes: number
  batchSize: number
  sources: CrawlSource[]
  lastRunAt?: string
}

export const DEFAULT_CRAWL_CONFIG: CrawlConfig = {
  version: 1,
  enabled: false,
  intervalMinutes: 60,
  batchSize: 5,
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
