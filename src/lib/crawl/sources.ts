import type { CrawlSource } from '@/types/crawl'

const defaultSources: CrawlSource[] = [
  { id: 'builtin_sakura_api', name: '樱花API', url: 'https://www.loliapi.com/acg/pe/', category: 'anime', enabled: true, responseType: 'redirect' },
  { id: 'builtin_hero_api', name: '赫萝API', url: 'https://api.mtyqx.cn/api/random.php', category: 'anime', enabled: true, responseType: 'redirect' },
  { id: 'builtin_lolicon_api', name: 'Lolicon API', url: 'https://api.lolicon.app/setu/v2', category: 'anime', enabled: true, responseType: 'json', jsonPath: 'data.0.urls.original' },
  { id: 'builtin_suiyue_xiaozhu', name: '岁月小筑', url: 'https://img.xjh.me/random_img.php?return=302&type=bg&ctype=acg', category: 'anime', enabled: true, responseType: 'redirect' },
  { id: 'builtin_pixiv_discovery', name: 'Pixiv Discovery', url: 'https://www.pixiv.net/ajax/illust/discovery?mode=safe&max=18', category: 'anime', enabled: true, responseType: 'pixiv' },
  { id: 'builtin_ciyuan_fengjing', name: '次元API-风景', url: 'https://t.alcy.cc/fj', category: 'real', enabled: true, responseType: 'redirect' },
  { id: 'builtin_ciyuan_meipai', name: '次元API-美拍', url: 'https://t.alcy.cc/mp', category: 'real', enabled: true, responseType: 'redirect' },
  { id: 'builtin_ciyuan_bizhi', name: '次元API-壁纸', url: 'https://t.alcy.cc/pc', category: 'real', enabled: true, responseType: 'redirect' },
]

export function mergeDefaultSources(sources: CrawlSource[]): CrawlSource[] {
  const merged = [...sources]

  for (const source of defaultSources) {
    const exists = merged.some(item => item.id === source.id || item.name === source.name || item.url === source.url)
    if (!exists) {
      merged.push({ ...source })
    }
  }

  return merged
}

export function getDefaultSources(): CrawlSource[] {
  return defaultSources.map(source => ({ ...source }))
}
