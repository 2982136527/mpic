import type { CrawlSource } from '@/types/crawl'

const defaultSources: Omit<CrawlSource, 'id'>[] = [
  { name: '樱花API', url: 'https://www.loliapi.com/acg/pe/', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '赫萝API', url: 'https://api.mtyqx.cn/api/random.php', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: 'Lolicon API', url: 'https://api.lolicon.app/setu/v2', category: 'anime', enabled: true, responseType: 'json', jsonPath: 'data.0.urls.original' },
  { name: '岁月小筑', url: 'https://img.xjh.me/random_img.php?return=302&type=bg&ctype=acg', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '次元API-风景', url: 'https://t.alcy.cc/fj', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '次元API-美拍', url: 'https://t.alcy.cc/mp', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '次元API-壁纸', url: 'https://t.alcy.cc/pc', category: 'real', enabled: true, responseType: 'redirect' },
]

let _idCounter = 0
function makeId(): string {
  return `src_${Date.now().toString(36)}_${(++_idCounter).toString(36)}`
}

export function getDefaultSources(): CrawlSource[] {
  return defaultSources.map(s => ({ ...s, id: makeId() }))
}
