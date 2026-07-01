import type { CrawlSource } from '@/types/crawl'

const pixivRankingSources: CrawlSource[] = [
  { id: 'builtin_pixiv_daily_ranking', name: 'Pixiv日榜', url: 'https://www.pixiv.net/ranking.php?mode=daily&content=illust&format=json&p=1', category: 'anime', enabled: true, responseType: 'pixiv' },
  { id: 'builtin_pixiv_weekly_ranking', name: 'Pixiv周榜', url: 'https://www.pixiv.net/ranking.php?mode=weekly&content=illust&format=json&p=1', category: 'anime', enabled: true, responseType: 'pixiv' },
  { id: 'builtin_pixiv_monthly_ranking', name: 'Pixiv月榜', url: 'https://www.pixiv.net/ranking.php?mode=monthly&content=illust&format=json&p=1', category: 'anime', enabled: true, responseType: 'pixiv' },
  { id: 'builtin_pixiv_rookie_ranking', name: 'Pixiv新人榜', url: 'https://www.pixiv.net/ranking.php?mode=rookie&content=illust&format=json&p=1', category: 'anime', enabled: true, responseType: 'pixiv' },
  { id: 'builtin_pixiv_male_ranking', name: 'Pixiv男性人气', url: 'https://www.pixiv.net/ranking.php?mode=male&content=illust&format=json&p=1', category: 'anime', enabled: true, responseType: 'pixiv' },
  { id: 'builtin_pixiv_top_rated', name: 'Pixiv高分精选', url: 'https://www.pixiv.net/ranking.php?mode=daily&content=illust&format=json&p=2', category: 'anime', enabled: true, responseType: 'pixiv' },
]

const defaultSources: CrawlSource[] = [
  { id: 'builtin_sakura_api', name: '樱花API', url: 'https://www.loliapi.com/acg/pe/', category: 'anime', enabled: false, responseType: 'redirect' },
  { id: 'builtin_hero_api', name: '赫萝API', url: 'https://api.mtyqx.cn/api/random.php', category: 'anime', enabled: false, responseType: 'redirect' },
  { id: 'builtin_lolicon_api', name: 'Lolicon API', url: 'https://api.lolicon.app/setu/v2', category: 'anime', enabled: false, responseType: 'json', jsonPath: 'data.0.urls.original' },
  { id: 'builtin_suiyue_xiaozhu', name: '岁月小筑', url: 'https://img.xjh.me/random_img.php?return=302&type=bg&ctype=acg', category: 'anime', enabled: false, responseType: 'redirect' },
  ...pixivRankingSources,
  { id: 'builtin_ciyuan_fengjing', name: '次元API-风景', url: 'https://t.alcy.cc/fj', category: 'real', enabled: false, responseType: 'redirect' },
  { id: 'builtin_ciyuan_meipai', name: '次元API-美拍', url: 'https://t.alcy.cc/mp', category: 'real', enabled: false, responseType: 'redirect' },
  { id: 'builtin_ciyuan_bizhi', name: '次元API-壁纸', url: 'https://t.alcy.cc/pc', category: 'real', enabled: false, responseType: 'redirect' },
]

export function mergeDefaultSources(sources: CrawlSource[]): CrawlSource[] {
  const legacyPixivSource = sources.find(isLegacyPixivDiscoverySource)
  const merged = sources
    .filter(source => !isLegacyPixivDiscoverySource(source))
    .map(source => ({ ...source }))

  for (const source of defaultSources) {
    const exists = merged.some(item => item.id === source.id || item.name === source.name || item.url === source.url)
    if (!exists) {
      merged.push({
        ...source,
        ...(legacyPixivSource && isPixivRankingSource(source)
          ? { enabled: legacyPixivSource.enabled }
          : {}),
      })
    }
  }

  return merged
}

export function getDefaultSources(): CrawlSource[] {
  return defaultSources.map(source => ({ ...source }))
}

function isLegacyPixivDiscoverySource(source: CrawlSource): boolean {
  return source.id === 'builtin_pixiv_discovery' || source.url.includes('/ajax/illust/discovery')
}

function isPixivRankingSource(source: CrawlSource): boolean {
  return pixivRankingSources.some(item => item.id === source.id)
}
