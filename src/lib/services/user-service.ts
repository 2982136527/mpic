import { getJsonFile, updateJsonWithRetry } from '@/lib/github/client'
import { getSettings } from '@/lib/services/settings-service'
import type { UserRecord, UsersIndex } from '@/types/user'

const USERS_PATH = 'data/users.json'

function emptyIndex(): UsersIndex {
  return { version: 1, users: [] }
}

export async function ensureUser(login: string, avatarUrl: string): Promise<UserRecord> {
  let user: UserRecord | undefined
  const settings = await getSettings()

  await updateJsonWithRetry<UsersIndex>(USERS_PATH, current => {
    const index = current || emptyIndex()
    const existing = index.users.find(u => u.login === login)
    if (existing) {
      existing.lastActiveAt = new Date().toISOString()
      existing.avatarUrl = avatarUrl
      user = existing
    } else {
      const newUser: UserRecord = {
        login,
        avatarUrl,
        role: 'user',
        quotaBytes: settings.defaultQuotaBytes,
        banned: false,
        imageCount: 0,
        totalSize: 0,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      }
      index.users.push(newUser)
      user = newUser
    }
    return index
  })

  return user!
}

export async function getUser(login: string): Promise<UserRecord | null> {
  const file = await getJsonFile<UsersIndex>(USERS_PATH)
  if (!file) return null
  return file.data.users.find(u => u.login === login) || null
}

export async function listUsers(): Promise<UserRecord[]> {
  const file = await getJsonFile<UsersIndex>(USERS_PATH)
  if (!file) return []
  return file.data.users
}

export async function updateUser(login: string, changes: Partial<UserRecord>): Promise<void> {
  await updateJsonWithRetry<UsersIndex>(USERS_PATH, current => {
    const index = current || emptyIndex()
    const user = index.users.find(u => u.login === login)
    if (user) {
      Object.assign(user, changes)
    }
    return index
  })
}

export async function deleteUser(login: string): Promise<void> {
  await updateJsonWithRetry<UsersIndex>(USERS_PATH, current => {
    const index = current || emptyIndex()
    index.users = index.users.filter(u => u.login !== login)
    return index
  })
}

export async function updateUserStats(login: string, imageSizeDelta: number, imageCountDelta: number): Promise<void> {
  await updateJsonWithRetry<UsersIndex>(USERS_PATH, current => {
    const index = current || emptyIndex()
    const user = index.users.find(u => u.login === login)
    if (user) {
      user.totalSize = Math.max(0, user.totalSize + imageSizeDelta)
      user.imageCount = Math.max(0, user.imageCount + imageCountDelta)
    }
    return index
  })
}
