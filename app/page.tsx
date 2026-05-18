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
    <main className="min-h-screen bg-linear-to-b from-gray-50 to-white py-12">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Bài viết mới nhất</h1>
          <p className="mt-3 text-lg text-gray-600">Khám phá những bài viết thú vị từ cộng đồng</p>
        </div>

        {posts && posts.length > 0 ? (
          <>
            <div className="grid gap-6">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="group rounded-lg border border-gray-200 bg-white p-8 shadow-md transition-all hover:shadow-lg hover:border-blue-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <Link href={`/posts/${post.slug}`}>
                        <h2 className="text-2xl font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                          {post.title}
                        </h2>
                      </Link>

                      {post.excerpt ? (
                        <p className="mt-3 text-gray-700 leading-relaxed line-clamp-2">{post.excerpt}</p>
                      ) : null}

                      <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          <span>{post.profiles?.display_name || 'Ẩn danh'}</span>
                        </div>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h2A2.75 2.75 0 0119 6.75v10.5A2.75 2.75 0 0116.25 20H3.75A2.75 2.75 0 011 17.25V6.75C1 5.232 2.232 4 3.75 4h2V2.75A.75.75 0 015.75 2z" clipRule="evenodd" />
                          </svg>
                          <span>
                            {post.published_at
                              ? new Date(post.published_at).toLocaleDateString('vi-VN')
                              : 'Chưa xuất bản'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/posts/${post.slug}`}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 transition-colors whitespace-nowrap"
                    >
                      Đọc tiếp
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            <nav className="mt-12 flex items-center justify-between">
              {currentPage > 1 ? (
                <Link
                  href={currentPage - 1 === 1 ? '/' : `/?page=${currentPage - 1}`}
                  className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Trang trước
                </Link>
              ) : (
                <span className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-sm font-medium text-gray-400 cursor-not-allowed">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Trang trước
                </span>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Trang <span className="font-bold text-gray-900">{currentPage}</span> / <span className="font-bold text-gray-900">{totalPages}</span>
                </span>
              </div>

              {currentPage < totalPages ? (
                <Link
                  href={`/?page=${currentPage + 1}`}
                  className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Trang sau
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : (
                <span className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-sm font-medium text-gray-400 cursor-not-allowed">
                  Trang sau
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              )}
            </nav>
          </>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white py-16 text-center shadow-md">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4" />
            </svg>
            <p className="mt-4 text-lg text-gray-600">Chưa có bài viết nào</p>
            <p className="mt-1 text-sm text-gray-500">Hãy quay lại sau nhé!</p>
          </div>
        )}
      </div>
    </main>
  )
}
