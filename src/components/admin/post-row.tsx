'use client'
import { useState } from 'react'

export default function PostRow({ post }: { post: any }) {
  const [loading, setLoading] = useState(false)

  async function deletePost() {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return
    setLoading(true)
    const res = await fetch('/api/admin/delete-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: post.id }),
    })
    setLoading(false)
    if (res.ok) window.location.reload()
    else alert('Xóa thất bại')
  }

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <div className="font-semibold">{post.title}</div>
        <div className="text-sm text-gray-500">{post.slug} • {post.status}</div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={deletePost} disabled={loading} className="rounded-md bg-red-600 px-3 py-1 text-white">
          Delete
        </button>
      </div>
    </div>
  )
}
