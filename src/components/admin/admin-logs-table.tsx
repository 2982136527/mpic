'use client'

import type { AuditLogEntry } from '@/types/log'
import { useLang } from '@/lib/i18n/context'

type Props = {
  logs: AuditLogEntry[]
}

export function AdminLogsTable({ logs }: Props) {
  const { t } = useLang()

  const actionLabels: Record<string, string> = {
    upload: t.admin.uploadAction,
    delete: t.admin.deleteAction,
    permanent_delete: t.admin.permanentDeleteAction,
    update_user: t.admin.modifyUser,
    delete_user: t.admin.deleteUser,
    update_settings: t.admin.modifySettings,
  }

  if (logs.length === 0) {
    return <p className='py-8 text-center text-sm text-[var(--color-ink-soft)]'>{t.admin.noLogs}</p>
  }

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full text-left text-sm'>
        <thead className='text-xs text-[var(--color-ink-soft)]'>
          <tr>
            <th className='px-3 py-2'>{t.admin.time}</th>
            <th className='px-3 py-2'>{t.admin.action}</th>
            <th className='px-3 py-2'>{t.admin.operator}</th>
            <th className='px-3 py-2'>{t.admin.target}</th>
            <th className='px-3 py-2'>{t.admin.details}</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} className='border-t border-white/70'>
              <td className='whitespace-nowrap px-3 py-2 text-[var(--color-ink-soft)]'>
                {new Date(log.createdAt).toLocaleString('zh-CN')}
              </td>
              <td className='px-3 py-2'>
                <span className='rounded-full bg-[var(--color-bg)] px-2 py-0.5 text-xs text-[var(--color-ink)]'>
                  {actionLabels[log.action] || log.action}
                </span>
              </td>
              <td className='px-3 py-2 text-[var(--color-ink)]'>{log.actorLogin}</td>
              <td className='px-3 py-2 text-[var(--color-ink-soft)]'>{log.targetId || '-'}</td>
              <td className='max-w-[300px] truncate px-3 py-2 text-[var(--color-ink-soft)]'>{log.detail || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
