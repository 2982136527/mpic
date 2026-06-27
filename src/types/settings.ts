export type SiteSettings = {
  version: 1
  siteName: string
  siteDescription: string
  cdnBaseUrl: string
  maxFileSizeBytes: number
  defaultQuotaBytes: number
  allowRegistration: boolean
  enableCompress: boolean
}

export const DEFAULT_SETTINGS: SiteSettings = {
  version: 1,
  siteName: 'MPic',
  siteDescription: '多用户公开相册图床',
  cdnBaseUrl: '',
  maxFileSizeBytes: 5 * 1024 * 1024,
  defaultQuotaBytes: 100 * 1024 * 1024,
  allowRegistration: true,
  enableCompress: true,
}
