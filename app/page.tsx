import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 3

interface HomePageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = await createClient()
  const resolvedSearchParams = await searchParams
  const requestedPage = Number(resolvedSearchParams.page ?? '1')

  // Đếm tổng số bài đã publish để tính tổng trang
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')

  const totalPosts = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalPosts / PAGE_SIZE))
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), totalPages)
    : 1
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Lấy bài viết đã publish theo trang, kèm thông tin author
  const { data: posts, error } = await supabase
    .from('posts')
    .select(
      `
 *,
 profiles (
 display_name,
 avatar_url
 )
 `
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Error fetching posts:', error)
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Bài viết mới nhất</h1>

      {posts && posts.length > 0 ? (
        <>
          <div className="space-y-6">
            {posts.map((post) => (
              <article
                key={post.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow"
              >
                <Link href={`/posts/${post.slug}`}>
                  <h2 className="text-2xl font-semibold text-gray-900 transition-colors hover:text-blue-600">
                    {post.title}
                  </h2>
                </Link>

                {post.excerpt ? <p className="mt-2 text-gray-800">{post.excerpt}</p> : null}

                <div className="mt-4 flex items-center gap-4 text-sm text-gray-800">
                  <span>Bởi {post.profiles?.display_name || 'Ẩn danh'}</span>
                  <span>•</span>
                  <span>
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString('vi-VN')
                      : 'Chưa xuất bản'}
                  </span>
                </div>

                <Link
                  href={`/posts/${post.slug}`}
                  className="mt-4 inline-block text-blue-600 hover:text-blue-500"
                >
                  Đọc tiếp →
                </Link>
              </article>
            ))}
          </div>

          <nav className="mt-8 flex items-center justify-between">
            {currentPage > 1 ? (
              <Link
                href={currentPage - 1 === 1 ? '/' : `/?page=${currentPage - 1}`}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                ← Trang trước
              </Link>
            ) : (
              <span className="rounded-md border border-gray-200 bg-gray-100 px-4 py-2 text-sm text-gray-400">
                ← Trang trước
              </span>
            )}

            <span className="text-sm text-gray-700">
              Trang {currentPage}/{totalPages}
            </span>

            {currentPage < totalPages ? (
              <Link
                href={`/?page=${currentPage + 1}`}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Trang sau →
              </Link>
            ) : (
              <span className="rounded-md border border-gray-200 bg-gray-100 px-4 py-2 text-sm text-gray-400">
                Trang sau →
              </span>
            )}
          </nav>
        </>
      ) : (
        <div className="rounded-lg bg-gray-50 py-12 text-center">
          <p className="text-gray-500">Chưa có bài viết nào.</p>
        </div>
      )}
    </main>
  )
}
