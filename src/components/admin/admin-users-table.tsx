'use client'

import { useState } from 'react'
import type { UserRecord } from '@/types/user'
import { formatBytes } from '@/lib/utils'

type Props = {
  users: UserRecord[]
  onUpdate: (login: string, changes: Partial<UserRecord>) => Promise<void>
}

export function AdminUsersTable({ users: initialUsers, onUpdate }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [updating, setUpdating] = useState<string | null>(null)

  const handleToggleBan = async (user: UserRecord) => {
    setUpdating(user.login)
    try {
      await onUpdate(user.login, { banned: !user.banned })
      setUsers(prev => prev.map(u => u.login === user.login ? { ...u, banned: !u.banned } : u))
    } catch {
      alert('操作失败')
    } finally {
      setUpdating(null)
    }
  }

  const handleToggleRole = async (user: UserRecord) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    if (!confirm(`确定将 ${user.login} 设为${newRole === 'admin' ? '管理员' : '普通用户'}？`)) return
    setUpdating(user.login)
    try {
      await onUpdate(user.login, { role: newRole })
      setUsers(prev => prev.map(u => u.login === user.login ? { ...u, role: newRole } : u))
    } catch {
      alert('操作失败')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full text-left text-sm'>
        <thead className='text-xs text-[var(--color-ink-soft)]'>
          <tr>
            <th className='px-3 py-2'>用户</th>
            <th className='px-3 py-2'>角色</th>
            <th className='px-3 py-2'>状态</th>
            <th className='px-3 py-2'>图片</th>
            <th className='px-3 py-2'>存储</th>
            <th className='px-3 py-2'>配额</th>
            <th className='px-3 py-2'>操作</th>
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
                  {user.role === 'admin' ? '管理员' : '用户'}
                </span>
              </td>
              <td className='px-3 py-2'>
                <span className={`rounded-full px-2 py-0.5 text-xs ${user.banned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {user.banned ? '已封禁' : '正常'}
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
                    {user.role === 'admin' ? '取消管理' : '设为管理'}
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
                    {user.banned ? '解封' : '封禁'}
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
