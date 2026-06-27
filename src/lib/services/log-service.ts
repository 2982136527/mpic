import { getJsonFile, updateJsonWithRetry } from '@/lib/github/client'
import type { AuditLogEntry, AuditLogsIndex } from '@/types/log'

const LOGS_PATH = 'data/logs.json'

function emptyIndex(): AuditLogsIndex {
  return { version: 1, logs: [] }
}

export async function appendLog(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<void> {
  await updateJsonWithRetry<AuditLogsIndex>(LOGS_PATH, current => {
    const index = current || emptyIndex()
    index.logs.push({
      ...entry,
      id: crypto.randomUUID().slice(0, 8),
      createdAt: new Date().toISOString(),
    })
    return index
  })
}

export async function listLogs(params: { page?: number; pageSize?: number } = {}): Promise<{ logs: AuditLogEntry[]; total: number }> {
  const { page = 1, pageSize = 50 } = params
  const file = await getJsonFile<AuditLogsIndex>(LOGS_PATH)
  if (!file) return { logs: [], total: 0 }

  const sorted = [...file.data.logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const start = (page - 1) * pageSize
  return {
    logs: sorted.slice(start, start + pageSize),
    total: sorted.length,
  }
}
