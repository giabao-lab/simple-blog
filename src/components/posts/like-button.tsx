'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface LikeButtonProps {
  postId: string
  initialLikeCount: number
  initialIsLiked: boolean
}

export function LikeButton({ postId, initialLikeCount, initialIsLiked }: LikeButtonProps) {
  const router = useRouter()
  const supabase = createClient()

  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleLike = async () => {
    setError(null)
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Bạn cần đăng nhập để thích bài viết')
        return
      }

      if (isLiked) {
        const { error } = await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id)
        if (error) throw error
        setIsLiked(false)
        setLikeCount((current) => Math.max(0, current - 1))
      } else {
        const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: user.id })
        if (error) throw error
        setIsLiked(true)
        setLikeCount((current) => current + 1)
      }

      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggleLike}
        disabled={loading}
        className={`rounded-md px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
          isLiked ? 'bg-pink-600 hover:bg-pink-700' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Đang xử lý...' : isLiked ? 'Unlike' : 'Like'}
      </button>
      <span className="text-sm text-gray-700">{likeCount} lượt thích</span>
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </div>
  )
}
