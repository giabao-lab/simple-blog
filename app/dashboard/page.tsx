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
    <main className="min-h-screen bg-gray-100 py-12">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Bài viết của tôi</h1>
          <Link
            href="/dashboard/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
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
            <div className="rounded-lg bg-white py-12 text-center shadow">
              <p className="mb-4 text-gray-500">Bạn chưa có bài viết nào.</p>
              <Link href="/dashboard/new" className="text-blue-600 hover:text-blue-500">
                Viết bài đầu tiên →
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
