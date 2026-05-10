'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ProfileFormProps {
  userId: string
  initialDisplayName: string | null
  initialAvatarUrl: string | null
}

export function ProfileForm({ userId, initialDisplayName, initialAvatarUrl }: ProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [displayName, setDisplayName] = useState(initialDisplayName ?? '')
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        display_name: displayName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

      if (error) throw error

      setSuccess('Cập nhật profile thành công')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
      {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div> : null}
      {success ? (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>
      ) : null}

      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-900">
          Tên hiển thị
        </label>
        <input
          id="displayName"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="Nhập tên hiển thị"
        />
      </div>

      <div>
        <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-900">
          Avatar URL
        </label>
        <input
          id="avatarUrl"
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="https://..."
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : 'Lưu profile'}
        </button>
      </div>
    </form>
  )
}
