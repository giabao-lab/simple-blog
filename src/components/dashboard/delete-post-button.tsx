'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface DeletePostButtonProps {
  postId: string
  postTitle: string
}

export function DeletePostButton({ postId, postTitle }: DeletePostButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Bạn có chắc muốn xóa bài viết "${postTitle}"?`)) {
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId)

      if (error) {
        alert(`Lỗi: ${error.message}`)
        return
      }

      router.refresh()
    } catch {
      alert('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center rounded-2xl border border-red-700 bg-red-700/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-700/20 disabled:opacity-50"
    >
      {loading ? 'Đang xóa...' : 'Xóa'}
    </button>
  )
}
