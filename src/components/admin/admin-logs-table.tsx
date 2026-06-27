import type { AuditLogEntry } from '@/types/log'

type Props = {
  logs: AuditLogEntry[]
}

const actionLabels: Record<string, string> = {
  upload: '上传图片',
  delete: '删除图片',
  permanent_delete: '永久删除',
  update_user: '修改用户',
  delete_user: '删除用户',
  update_settings: '修改设置',
}

export function AdminLogsTable({ logs }: Props) {
  if (logs.length === 0) {
    return <p className='py-8 text-center text-sm text-[var(--color-ink-soft)]'>暂无操作记录</p>
  }

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full text-left text-sm'>
        <thead className='text-xs text-[var(--color-ink-soft)]'>
          <tr>
            <th className='px-3 py-2'>时间</th>
            <th className='px-3 py-2'>操作</th>
            <th className='px-3 py-2'>操作人</th>
            <th className='px-3 py-2'>目标</th>
            <th className='px-3 py-2'>详情</th>
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
