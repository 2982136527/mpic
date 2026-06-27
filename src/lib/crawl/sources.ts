import type { CrawlSource } from '@/types/crawl'

const defaultSources: Omit<CrawlSource, 'id'>[] = [
  { name: '樱花API', url: 'https://www.loliapi.com/acg/pe/', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '赫萝API', url: 'https://api.mtyqx.cn/api/random.php', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: 'Lolicon API', url: 'https://api.lolicon.app/setu/v2', category: 'anime', enabled: true, responseType: 'json', jsonPath: 'data.0.urls.original' },
]

let _idCounter = 0
function makeId(): string {
  return `src_${Date.now().toString(36)}_${(++_idCounter).toString(36)}`
}

export function getDefaultSources(): CrawlSource[] {
  return defaultSources.map(s => ({ ...s, id: makeId() }))
}
