export type AccessLogType = 'page_view' | 'random_api' | 'images_api' | 'image_meta_api'

export type AccessActorRole = 'guest' | 'user' | 'admin'

export type AccessDeviceType = 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown'

export type AccessLogEntry = {
  id: string
  createdAt: string
  type: AccessLogType
  path: string
  method: string
  status: number
  ip?: string
  visitorKey?: string
  referer?: string
  userAgent?: string
  browser?: string
  os?: string
  deviceType: AccessDeviceType
  actorRole: AccessActorRole
  actorLogin?: string
  actorGithubId?: string
  imageId?: string
  imageTitle?: string
  detail?: string
}

export type AccessImageCounter = {
  imageId: string
  imageTitle?: string
  totalCount: number
  randomCount: number
  metaCount: number
  lastAt: string
}

export type AccessLogsIndex = {
  version: 1
  logs: AccessLogEntry[]
  counters: {
    total: number
    byType: Partial<Record<AccessLogType, number>>
    images: AccessImageCounter[]
  }
}

export type AccessOverview = {
  enabled: boolean
  total: number
  pageViews: number
  randomApiCalls: number
  imagesApiCalls: number
  imageMetaCalls: number
  uniqueVisitors: number
  loggedInCalls: number
  retainedLogs: number
  retentionLimit: number
  topImages: AccessImageCounter[]
}
