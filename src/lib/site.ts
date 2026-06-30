export const siteMeta = {
  name: 'MPic',
  description: 'MPic 免费二次元图床 — ACG 动漫插画、摄影作品上传分享平台。支持 Pixiv 代理、EXIF 查看、画师作品展示与多用户相册托管。',
}

export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!envUrl) return 'http://localhost:3000'
  return envUrl.replace(/\/$/, '')
}
