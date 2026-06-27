export const siteMeta = {
  name: 'Mpic',
  description: '多用户公开相册图床，基于 GitHub 存储',
}

export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!envUrl) return 'http://localhost:3000'
  return envUrl.replace(/\/$/, '')
}
