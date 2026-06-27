export type AuditLogEntry = {
  id: string
  action: string
  actorLogin: string
  targetId?: string
  detail?: string
  createdAt: string
}

export type AuditLogsIndex = {
  version: 1
  logs: AuditLogEntry[]
}
