import { getJsonFile, updateJsonWithRetry } from '@/lib/github/client'
import { DEFAULT_SETTINGS, type SiteSettings } from '@/types/settings'

const SETTINGS_PATH = 'data/settings.json'

export async function getSettings(): Promise<SiteSettings> {
  const file = await getJsonFile<SiteSettings>(SETTINGS_PATH)
  if (!file) return DEFAULT_SETTINGS
  return { ...DEFAULT_SETTINGS, ...file.data }
}

export async function updateSettings(changes: Partial<SiteSettings>): Promise<SiteSettings> {
  await updateJsonWithRetry<SiteSettings>(SETTINGS_PATH, current => {
    const base = current || DEFAULT_SETTINGS
    return { ...base, ...changes, version: 1 }
  })
  return getSettings()
}
