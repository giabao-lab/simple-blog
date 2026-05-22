import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PostList } from '@/components/dashboard/post-list'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Lấy tất cả bài viết của user (kể cả draft)
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching posts:', error)
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-50 to-white py-10 lg:py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-200/70 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">Dashboard</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900">Bài viết của tôi</h1>
            <p className="mt-2 text-sm text-gray-600">
              Quản lý bài viết, chỉnh sửa nội dung và xuất bản với giao diện rõ ràng hơn.
            </p>
          </div>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            + Viết bài mới
          </Link>
        </div>

        <div className="mx-auto">
          {posts && posts.length > 0 ? (
            <div className="grid gap-6">
              <PostList posts={posts} />
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white py-16 text-center shadow-lg shadow-gray-200/70">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="mt-5 text-2xl font-bold text-gray-900">Bạn chưa có bài viết nào</h2>
              <p className="mt-2 text-gray-600">Hãy tạo bài viết đầu tiên để bắt đầu xây dựng blog của bạn.</p>
              <Link
                href="/dashboard/new"
                className="mt-6 inline-flex items-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
              >
                Viết bài đầu tiên →
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
