'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface FeaturedToggleProps {
  postId: string
  isFeatured: boolean
}

export function FeaturedToggle({ postId, isFeatured }: FeaturedToggleProps) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleFeatured = async () => {
    setError(null)
    setLoading(true)

    try {
      const newStatus = !isFeatured

      const { error: updateError } = await supabase
        .from('posts')
        .update({ is_featured: newStatus })
        .eq('id', postId)

      if (updateError) throw updateError

      // Refresh page to update display
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggleFeatured}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
          isFeatured
            ? 'bg-amber-600 hover:bg-amber-700 text-white'
            : 'bg-slate-700 hover:bg-slate-600 text-slate-100'
        }`}
      >
        <span>{isFeatured ? '⭐' : '☆'}</span>
        {loading ? 'Đang xử lý...' : isFeatured ? 'Bỏ nổi bật' : 'Đặt nổi bật'}
      </button>
      {error && <span className="text-sm text-red-400">{error}</span>}
    </div>
  )
}
