'use client'

import type { UserRecord } from '@/types/user'
import { AdminUsersTable } from '@/components/admin/admin-users-table'
import { useLang } from '@/lib/i18n/context'

type Props = {
  users: UserRecord[]
}

export function AdminUsersPage({ users }: Props) {
  const { t } = useLang()
  const handleUpdate = async (login: string, changes: Partial<UserRecord>) => {
    const res = await fetch(`/api/admin/user/${login}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    })
    if (!res.ok) throw new Error('Update failed')
  }

  return (
    <div className='space-y-5'>
      <section className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
        <h2 className='font-title text-3xl text-[var(--color-ink)]'>{t.admin.userManage}</h2>
        <p className='text-sm text-[var(--color-ink-soft)]'>{t.admin.totalUsers(users.length)}</p>
      </section>

      <section className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
        <AdminUsersTable users={users} onUpdate={handleUpdate} />
      </section>
    </div>
  )
}
