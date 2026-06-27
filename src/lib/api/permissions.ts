export function getAdminLogins(): string[] {
  // 优先使用 ADMIN_GITHUB_USERNAMES，未设置则用 IMAGE_GITHUB_OWNER
  const envAdmins = process.env.ADMIN_GITHUB_USERNAMES
  if (envAdmins) {
    return envAdmins
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
  }

  const owner = (process.env.IMAGE_GITHUB_OWNER || '').trim().toLowerCase()
  return owner ? [owner] : []
}

export function isAdminLogin(login: string | null | undefined): boolean {
  if (!login) return false
  return getAdminLogins().includes(login.trim().toLowerCase())
}
