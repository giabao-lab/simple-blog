'use client'
import { useState } from 'react'
import { FeaturedToggle } from './featured-toggle'
import Link from 'next/link'

export default function PostRow({ post }: { post: any }) {
  const [loading, setLoading] = useState(false)

  async function deletePost() {
    if (!confirm('Bạn có chắc muốn xóa bài viết này? Hành động này không thể hoàn tác.')) return
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl transition-colors hover:bg-white/5"
      style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/posts/${post.slug}`} target="_blank"
            className="font-semibold text-sm hover:underline" style={{ color: '#f1f5f9' }}>
            {post.title}
          </Link>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={post.status === 'published' 
              ? { background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }
              : { background: 'rgba(255,255,255,0.1)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
            {post.status}
          </span>
        </div>
        <div className="text-xs font-mono truncate" style={{ color: '#64748b' }}>/{post.slug}</div>
      </div>

      <div className="flex items-center gap-3">
        <FeaturedToggle postId={post.id} isFeatured={post.is_featured || false} />
        
        <button onClick={deletePost} disabled={loading} 
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/10 disabled:opacity-50 group"
          title="Xóa bài viết">
          <svg className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
