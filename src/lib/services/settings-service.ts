import { getPublicJsonFile, updateJsonWithRetry } from '@/lib/github/client'
import { DEFAULT_SETTINGS, type SiteSettings } from '@/types/settings'

const SETTINGS_PATH = 'data/settings.json'

export async function getSettings(): Promise<SiteSettings> {
  const data = await getPublicJsonFile<SiteSettings>(SETTINGS_PATH)
  if (!data) return DEFAULT_SETTINGS
  return normalizeSettings(data)
}

export async function updateSettings(changes: Partial<SiteSettings>): Promise<SiteSettings> {
  await updateJsonWithRetry<SiteSettings>(SETTINGS_PATH, current => {
    return normalizeSettings({ ...(current || {}), ...changes })
  })
  return getSettings()
}

function normalizeSettings(input: Partial<SiteSettings> | null | undefined): SiteSettings {
  return {
    version: 1,
    siteName: input?.siteName ?? DEFAULT_SETTINGS.siteName,
    siteDescription: input?.siteDescription ?? DEFAULT_SETTINGS.siteDescription,
    cdnBaseUrl: input?.cdnBaseUrl ?? DEFAULT_SETTINGS.cdnBaseUrl,
    maxFileSizeBytes: input?.maxFileSizeBytes ?? DEFAULT_SETTINGS.maxFileSizeBytes,
    defaultQuotaBytes: input?.defaultQuotaBytes ?? DEFAULT_SETTINGS.defaultQuotaBytes,
    allowRegistration: input?.allowRegistration ?? DEFAULT_SETTINGS.allowRegistration,
    enableCompress: input?.enableCompress ?? DEFAULT_SETTINGS.enableCompress,
    enableRandomApi: input?.enableRandomApi ?? DEFAULT_SETTINGS.enableRandomApi,
    enableAccessLog: input?.enableAccessLog ?? DEFAULT_SETTINGS.enableAccessLog,
    enableImagesApi: input?.enableImagesApi ?? DEFAULT_SETTINGS.enableImagesApi,
  }
}
