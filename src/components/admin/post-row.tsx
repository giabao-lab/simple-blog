'use client'
import { useState } from 'react'
import { FeaturedToggle } from './featured-toggle'

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
        <div className="font-semibold text-slate-100">{post.title}</div>
        <div className="text-sm text-slate-400">{post.slug} • {post.status}</div>
      </div>
      <div className="flex items-center gap-2">
        <FeaturedToggle postId={post.id} isFeatured={post.is_featured || false} />
        <button onClick={deletePost} disabled={loading} className="rounded-md bg-red-600 px-3 py-1 text-white hover:bg-red-700 disabled:opacity-50">
          Delete
        </button>
      </div>
    </div>
  )
}
