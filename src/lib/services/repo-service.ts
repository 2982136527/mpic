import { getJsonFile, updateJsonWithRetry, createRepo, getRepoSize } from '@/lib/github/client'
import { getDefaultRepoName } from '@/lib/github/env'

const REPOS_INDEX_PATH = 'data/repos.json'
const MAX_REPO_BYTES = 4 * 1024 * 1024 * 1024 // 4GB per repo (GitHub hard limit 5GB)

type RepoEntry = {
  name: string
  totalSize: number // tracked locally, synced with GitHub on upload
  createdAt: string
}

type ReposIndex = {
  version: 1
  repos: RepoEntry[]
}

function emptyReposIndex(): ReposIndex {
  return { version: 1, repos: [] }
}

function getBaseRepo(): string {
  return getDefaultRepoName()
}

// Initialize repos index if it doesn't exist, ensuring base repo is included
async function ensureReposIndex(): Promise<ReposIndex> {
  const file = await getJsonFile<ReposIndex>(REPOS_INDEX_PATH)
  if (file) return file.data

  // Create initial index with the base repo
  const baseRepo = getBaseRepo()
  const index: ReposIndex = {
    version: 1,
    repos: [{ name: baseRepo, totalSize: 0, createdAt: new Date().toISOString() }],
  }

  await updateJsonWithRetry<ReposIndex>(REPOS_INDEX_PATH, () => index)
  return index
}

// Get the current active repo (the one that has space)
export async function getActiveRepo(): Promise<string> {
  const index = await ensureReposIndex()

  // Find the latest repo that hasn't exceeded the limit
  for (let i = index.repos.length - 1; i >= 0; i--) {
    if (index.repos[i].totalSize < MAX_REPO_BYTES) {
      return index.repos[i].name
    }
  }

  // All repos are full, create a new one
  const newRepoName = `${getBaseRepo()}-${index.repos.length + 1}`

  try {
    await createRepo(newRepoName)
  } catch (err: unknown) {
    // If repo already exists, that's fine
    if (err instanceof Error && !err.message.includes('already exists')) {
      throw err
    }
  }

  await updateJsonWithRetry<ReposIndex>(REPOS_INDEX_PATH, current => {
    const idx = current || emptyReposIndex()
    idx.repos.push({ name: newRepoName, totalSize: 0, createdAt: new Date().toISOString() })
    return idx
  })

  return newRepoName
}

// Update the tracked size of a repo after upload/delete
export async function updateRepoSize(repoName: string, sizeDelta: number): Promise<void> {
  await updateJsonWithRetry<ReposIndex>(REPOS_INDEX_PATH, current => {
    const index = current || emptyReposIndex()
    const repo = index.repos.find(r => r.name === repoName)
    if (repo) {
      repo.totalSize = Math.max(0, repo.totalSize + sizeDelta)
    }
    return index
  })
}

// Get all repos with their sizes
export async function listRepos(): Promise<RepoEntry[]> {
  const index = await ensureReposIndex()
  return index.repos
}

// Sync repo sizes from GitHub (for admin use)
export async function syncRepoSizes(): Promise<RepoEntry[]> {
  const index = await ensureReposIndex()

  for (const repo of index.repos) {
    try {
      repo.totalSize = await getRepoSize(repo.name)
    } catch {
      // Skip if repo doesn't exist or API error
    }
  }

  await updateJsonWithRetry<ReposIndex>(REPOS_INDEX_PATH, () => index)
  return index.repos
}
