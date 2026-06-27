'use client'

import { useState } from 'react'
import type { UserRecord } from '@/types/user'
import { formatBytes } from '@/lib/utils'
import { useLang } from '@/lib/i18n/context'

type Props = {
  users: UserRecord[]
  onUpdate: (login: string, changes: Partial<UserRecord>) => Promise<void>
}

export function AdminUsersTable({ users: initialUsers, onUpdate }: Props) {
  const { t } = useLang()
  const [users, setUsers] = useState(initialUsers)
  const [updating, setUpdating] = useState<string | null>(null)

  const handleToggleBan = async (user: UserRecord) => {
    setUpdating(user.login)
    try {
      await onUpdate(user.login, { banned: !user.banned })
      setUsers(prev => prev.map(u => u.login === user.login ? { ...u, banned: !u.banned } : u))
    } catch {
      alert(t.common.operationFailed)
    } finally {
      setUpdating(null)
    }
  }

  const handleToggleRole = async (user: UserRecord) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    if (!confirm(t.admin.roleConfirm(user.login, newRole === 'admin' ? t.admin.adminRole : t.admin.userRole))) return
    setUpdating(user.login)
    try {
      await onUpdate(user.login, { role: newRole })
      setUsers(prev => prev.map(u => u.login === user.login ? { ...u, role: newRole } : u))
    } catch {
      alert(t.common.operationFailed)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full text-left text-sm'>
        <thead className='text-xs text-[var(--color-ink-soft)]'>
          <tr>
            <th className='px-3 py-2'>{t.admin.uploader}</th>
            <th className='px-3 py-2'>{t.admin.role}</th>
            <th className='px-3 py-2'>{t.admin.status}</th>
            <th className='px-3 py-2'>{t.admin.images}</th>
            <th className='px-3 py-2'>{t.admin.storage}</th>
            <th className='px-3 py-2'>{t.admin.quota}</th>
            <th className='px-3 py-2'>{t.admin.action}</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.login} className='border-t border-white/70'>
              <td className='px-3 py-2'>
                <div className='flex items-center gap-2'>
                  <img src={user.avatarUrl} alt='' className='h-6 w-6 rounded-full' />
                  <span className='text-[var(--color-ink)]'>{user.login}</span>
                </div>
              </td>
              <td className='px-3 py-2'>
                <span className={`rounded-full px-2 py-0.5 text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                  {user.role === 'admin' ? t.admin.adminRole : t.admin.userRole}
                </span>
              </td>
              <td className='px-3 py-2'>
                <span className={`rounded-full px-2 py-0.5 text-xs ${user.banned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {user.banned ? t.admin.banned : t.admin.normal}
                </span>
              </td>
              <td className='px-3 py-2 text-[var(--color-ink-soft)]'>{user.imageCount}</td>
              <td className='px-3 py-2 text-[var(--color-ink-soft)]'>{formatBytes(user.totalSize)}</td>
              <td className='px-3 py-2 text-[var(--color-ink-soft)]'>{formatBytes(user.quotaBytes)}</td>
              <td className='px-3 py-2'>
                <div className='flex gap-2'>
                  <button
                    type='button'
                    disabled={updating === user.login}
                    onClick={() => handleToggleRole(user)}
                    className='rounded-lg border border-[var(--color-border-strong)] bg-white px-2 py-1 text-xs text-[var(--color-ink)] transition hover:border-[var(--color-brand)] disabled:opacity-50'>
                    {user.role === 'admin' ? t.admin.revokeAdmin : t.admin.setAdmin}
                  </button>
                  <button
                    type='button'
                    disabled={updating === user.login}
                    onClick={() => handleToggleBan(user)}
                    className={`rounded-lg px-2 py-1 text-xs transition disabled:opacity-50 ${
                      user.banned
                        ? 'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                        : 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                    }`}>
                    {user.banned ? t.admin.unban : t.admin.ban}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
