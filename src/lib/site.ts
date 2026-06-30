export const siteMeta = {
  name: 'MPic',
  description: 'MPic 免费公开图床 — 多用户图片上传、分享与相册托管。支持 Pixiv 代理、EXIF 信息查看，基于 GitHub 存储。',
}

export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!envUrl) return 'http://localhost:3000'
  return envUrl.replace(/\/$/, '')
}
