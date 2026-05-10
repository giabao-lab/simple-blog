'use client'
import Link from 'next/link'
import { Post } from '@/types/database'
import { DeletePostButton } from '@/components/dashboard/delete-post-button'

interface PostListProps {
  posts: Post[]
}

export function PostList({ posts }: PostListProps) {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
        >
          <div className="sm:flex sm:items-start sm:justify-between">
            <div className="sm:flex-1">
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-gray-900">{post.title}</h2>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                    post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {post.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                </span>
              </div>
              {post.excerpt ? <p className="mb-2 text-sm text-gray-600">{post.excerpt}</p> : null}
              <p className="text-xs text-gray-500">Tạo ngày: {new Date(post.created_at).toLocaleDateString('vi-VN')}</p>
            </div>
            <div className="mt-4 flex items-center gap-3 sm:mt-0 sm:ml-6">
              {post.status === 'published' ? (
                <Link href={`/posts/${post.slug}`} className="rounded px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Xem
                </Link>
              ) : (
                <Link href={`/dashboard/preview/${post.id}`} className="rounded px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Xem
                </Link>
              )}
              <Link href={`/dashboard/edit/${post.id}`} className="rounded px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50">
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
