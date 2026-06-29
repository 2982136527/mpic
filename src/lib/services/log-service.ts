import { getPublicJsonFile, updateJsonWithRetry } from '@/lib/github/client'
import type { AuditLogEntry, AuditLogsIndex } from '@/types/log'

const LOGS_PATH = 'data/logs.json'
const MAX_AUDIT_LOGS = 1000
const MAX_ACTION_LENGTH = 64
const MAX_LOGIN_LENGTH = 64
const MAX_TARGET_ID_LENGTH = 128
const MAX_DETAIL_LENGTH = 1000

function emptyIndex(): AuditLogsIndex {
  return { version: 1, logs: [] }
}

export async function appendLog(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<void> {
  await updateJsonWithRetry<AuditLogsIndex>(LOGS_PATH, current => {
    const index = current || emptyIndex()
    index.logs.push({
      ...normalizeEntry(entry),
      id: crypto.randomUUID().slice(0, 8),
      createdAt: new Date().toISOString(),
    })
    if (index.logs.length > MAX_AUDIT_LOGS) {
      index.logs = index.logs.slice(-MAX_AUDIT_LOGS)
    }
    return index
  })
}

export async function listLogs(params: { page?: number; pageSize?: number } = {}): Promise<{ logs: AuditLogEntry[]; total: number }> {
  const { page = 1, pageSize = 50 } = params
  const data = await getPublicJsonFile<AuditLogsIndex>(LOGS_PATH)
  if (!data) return { logs: [], total: 0 }

  const sorted = [...data.logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const start = (page - 1) * pageSize
  return {
    logs: sorted.slice(start, start + pageSize),
    total: sorted.length,
  }
}

function normalizeEntry(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): Omit<AuditLogEntry, 'id' | 'createdAt'> {
  return {
    action: trimText(entry.action, MAX_ACTION_LENGTH) || 'unknown',
    actorLogin: trimText(entry.actorLogin, MAX_LOGIN_LENGTH) || 'unknown',
    targetId: trimText(entry.targetId, MAX_TARGET_ID_LENGTH),
    detail: trimText(entry.detail, MAX_DETAIL_LENGTH),
  }
}

function trimText(value: string | undefined, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, maxLength)
}
