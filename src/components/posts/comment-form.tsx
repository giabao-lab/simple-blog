'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface CommentFormProps {
  postId: string
}

export function CommentForm({ postId }: CommentFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Bạn cần đăng nhập để bình luận')
        return
      }

      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        author_id: user.id,
        content,
      })

      if (error) throw error

      setContent('')
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <div className="rounded-2xl border border-red-700 bg-red-900/20 px-4 py-3 text-sm text-red-300">{error}</div>
      ) : null}

      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
          className="w-full rounded-2xl border border-slate-700 bg-slate-700/30 px-4 py-3 text-slate-100 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-900/20 placeholder:text-slate-500"
          placeholder="Viết bình luận của bạn..."
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Đang gửi...' : 'Gửi bình luận'}
        </button>
      </div>
    </form>
  )
}
