import type { CrawlSource } from '@/types/crawl'

// 二次元 Anime APIs
const animeSources: Omit<CrawlSource, 'id'>[] = [
  { name: '樱花API', url: 'https://www.loliapi.com/acg/pe/', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: 'EEE.DOG', url: 'https://www.dogdogdog.pw/api.php', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: 'seamee API', url: 'https://acg.sea.icu/api.php', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '浪心API', url: 'https://api.lonxin.top/random.php', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '韩小韩API', url: 'https://api.vvhan.com/api/acgimg', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '三秋API', url: 'https://api.sqy.top/acg', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: 'LoliAPI', url: 'https://www.loliapi.com/acg/', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '赫萝API', url: 'https://api.mtyqx.cn/api/random.php', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '魅影API', url: 'https://api.paugram.com/acg/', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '保罗API', url: 'https://api.pwl.icu/api/sjtx', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '小歪API', url: 'https://api.ixiaowo.cn/acg/pe/', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '雨天API', url: 'https://api.yujn.cn/api/pe.php', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '柠檬API', url: 'https://api.mlecy.com/acg/', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '鱼塘API', url: 'https://api.iowen.cn/acg/', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '随缘API', url: 'https://api.loprint.cn/random/', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '墨染API', url: 'https://api.muran.top/', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '轻飘API', url: 'https://api.qpblog.top/acg/', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '小黑API', url: 'https://api.xiaohd.com/random.php', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '东方API', url: 'https://api.east.red/acg', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '猫咪API', url: 'https://api.likepoems.com/img/', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '小良API', url: 'https://api.xiaoliangla.com/acg/pe/', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '雪 Nguyệt API', url: 'https://api.xuewuyue.top/api/acg', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '小糖API', url: 'https://api.xiaotang.xyz/acg/pe/', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '无名API', url: 'https://api.wmimg.com/random.php', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '萌图API', url: 'https://api.moeimg.top/acg/pe/', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '夏沫API', url: 'https://api.xiamo.ml/acg', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '小枫API', url: 'https://api.xfabe.com/acg/pe/', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: '七夜API', url: 'https://api.qiuye.cloud/acg', category: 'anime', enabled: true, responseType: 'redirect' },
  { name: 'Lolicon API', url: 'https://api.lolicon.app/setu/v2', category: 'anime', enabled: true, responseType: 'json', jsonPath: 'data.0.urls.original' },
  { name: 'Jitsu API', url: 'https://api.jitsu.cn/img/random?type=json', category: 'anime', enabled: true, responseType: 'json', jsonPath: 'imgurl' },
]

// 三次元 COS/人物 APIs
const realSources: Omit<CrawlSource, 'id'>[] = [
  { name: '夏沫博客', url: 'https://blog.xiamo.ml/api/random.php', category: 'real', enabled: true, responseType: 'json', jsonPath: 'imgurl' },
  { name: '星河API', url: 'https://api.xinghe.one/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '小小API', url: 'https://api.xxoo.cf/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '无铭API', url: 'https://api.wumlng.cn/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '汤姆API', url: 'https://api.tomys.top/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '小猫API', url: 'https://api.xiaomao.cool/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '初音API', url: 'https://api.qiuqiu.cloud/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '小花API', url: 'https://api.xiaohua.pp.ua/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '小樱API', url: 'https://api.xiaoying.top/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '小雨API', url: 'https://api.xiaoyu.cloud/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '小月API', url: 'https://api.xiaoyue.top/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '小星API', url: 'https://api.xiaoxing.top/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '小云API', url: 'https://api.xiaoyun.top/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '小风API', url: 'https://api.xiaofeng.top/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '小雪API', url: 'https://api.xiaoxue.top/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '小梦API', url: 'https://api.xiaomeng.top/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '小幻API', url: 'https://api.xiaohuan.top/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '小影API', url: 'https://api.xiaoying.cloud/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '小灵API', url: 'https://api.xiaoling.top/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '小夜API', url: 'https://api.xiaoye.top/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '小白API', url: 'https://api.xiaobai.pub/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '九月API', url: 'https://api.september.red/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '萌新API', url: 'https://api.mengxin.cloud/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '猫娘API', url: 'https://api.maoniang.top/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
  { name: '桃子API', url: 'https://api.taozi.cloud/api/random.php', category: 'real', enabled: true, responseType: 'redirect' },
]

let _idCounter = 0
function makeId(): string {
  return `src_${Date.now().toString(36)}_${(++_idCounter).toString(36)}`
}

export function getDefaultSources(): CrawlSource[] {
  return [...animeSources, ...realSources].map(s => ({ ...s, id: makeId() }))
}
