'use client'
import Link from 'next/link'
import { Post } from '@/types/database'
import { DeletePostButton } from '@/components/dashboard/delete-post-button'

interface PostListProps {
  posts: Post[]
}

export function PostList({ posts }: PostListProps) {
  return (
    <div className="space-y-5">
      {posts.map((post) => (
        <div
          key={post.id}
          className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-200/70 transition-all hover:-translate-y-0.5 hover:shadow-xl"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{post.title}</h2>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    post.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {post.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                </span>
              </div>
              {post.excerpt ? <p className="mb-4 max-w-3xl text-sm leading-6 text-gray-600">{post.excerpt}</p> : null}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span>Tạo ngày: {new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                <span>•</span>
                <span>Cập nhật: {new Date(post.updated_at).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              {post.status === 'published' ? (
                <Link
                  href={`/posts/${post.slug}`}
                  className="inline-flex items-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  Xem
                </Link>
              ) : (
                <Link
                  href={`/dashboard/preview/${post.id}`}
                  className="inline-flex items-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  Xem
                </Link>
              )}
              <Link
                href={`/dashboard/edit/${post.id}`}
                className="inline-flex items-center rounded-2xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Sửa
              </Link>
              <DeletePostButton postId={post.id} postTitle={post.title} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
