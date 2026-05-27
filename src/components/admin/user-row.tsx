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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl transition-colors hover:bg-white/5"
      style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)' }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: user.role === 'admin' ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
          {(user.display_name || 'U')[0].toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm" style={{ color: '#f1f5f9' }}>{user.display_name || 'Không có tên'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={user.role === 'admin' 
                ? { background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }
                : { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
              {user.role}
            </span>
            {user.is_banned && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                Banned
              </span>
            )}
          </div>
          <div className="text-xs mt-1 font-mono" style={{ color: '#64748b' }}>{user.id.split('-')[0]}...{user.id.split('-').pop()}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {user.role !== 'admin' ? (
          <button disabled={loading} onClick={() => changeRole('admin')} 
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#f1f5f9' }}>
            Make Admin
          </button>
        ) : (
          <button disabled={loading} onClick={() => changeRole('user')} 
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
            Revoke Admin
          </button>
        )}
        
        {user.is_banned ? (
          <button disabled={loading} onClick={() => setBan(false)} 
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
            Unban
          </button>
        ) : (
          <button disabled={loading} onClick={() => setBan(true)} 
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            Ban
          </button>
        )}
      </div>
    </div>
  )
}
