'use client'
import { useState } from 'react'

export default function UserRow({ user }: { user: any }) {
  const [loading, setLoading] = useState(false)

  async function changeRole(newRole: string) {
    setLoading(true)
    const res = await fetch('/api/admin/change-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, role: newRole }),
    })
    setLoading(false)
    if (res.ok) {
      window.location.reload()
    } else {
      alert('Không thể thay đổi role')
    }
  }

  async function setBan(banned: boolean) {
    if (banned && !confirm('Bạn có chắc muốn cấm người dùng này?')) return
    setLoading(true)
    const res = await fetch('/api/admin/ban-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, isBanned: banned }),
    })
    setLoading(false)
    if (res.ok) window.location.reload()
    else alert('Thao tác thất bại')
  }

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <div className="font-semibold">{user.display_name || 'Không có tên'}</div>
        <div className="text-sm text-gray-500">{user.id}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="rounded-full px-3 py-1 text-sm bg-gray-100">{user.role}</div>
        {user.role !== 'admin' ? (
          <button disabled={loading} onClick={() => changeRole('admin')} className="rounded-md bg-blue-600 px-3 py-1 text-white">
            Make Admin
          </button>
        ) : (
          <button disabled={loading} onClick={() => changeRole('user')} className="rounded-md bg-gray-200 px-3 py-1">
            Revoke
          </button>
        )}
        {user.is_banned ? (
          <button disabled={loading} onClick={() => setBan(false)} className="rounded-md bg-green-600 px-3 py-1 text-white">
            Unban
          </button>
        ) : (
          <button disabled={loading} onClick={() => setBan(true)} className="rounded-md bg-red-600 px-3 py-1 text-white">
            Ban
          </button>
        )}
      </div>
    </div>
  )
}
