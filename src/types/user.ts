export type UserRole = 'user' | 'admin'

export type UserRecord = {
  login: string
  avatarUrl: string
  role: UserRole
  quotaBytes: number
  banned: boolean
  imageCount: number
  totalSize: number
  createdAt: string
  lastActiveAt: string
}

export type UsersIndex = {
  version: 1
  users: UserRecord[]
}
