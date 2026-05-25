import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Post } from '@/types/database'

const PAGE_SIZE = 6

interface HomePageProps {
  searchParams: Promise<{ page?: string; q?: string; author_id?: string; author_name?: string; sort?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = await createClient()
  const resolvedSearchParams = await searchParams
  const requestedPage = Number(resolvedSearchParams.page ?? '1')
  const searchQuery = (resolvedSearchParams.q ?? '').trim()
  const authorName = (resolvedSearchParams.author_name ?? '').trim()
  const sortBy = resolvedSearchParams.sort ?? 'newest' // 'newest' | 'most_liked'
  let authorFilter = resolvedSearchParams.author_id ?? ''

  // If author_name is provided, lookup the author_id
  if (authorName && !authorFilter) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .ilike('display_name', `%${authorName}%`)
      .limit(1)
    if (profiles?.length) {
      authorFilter = profiles[0].id
    }
  }

  // Build count query with filters
  let countQuery = supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
  if (searchQuery) {
    countQuery = countQuery.or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`)
  }
  if (authorFilter) {
    countQuery = countQuery.eq('author_id', authorFilter)
  }

  const { count } = await countQuery
  const totalPosts = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalPosts / PAGE_SIZE))
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), totalPages)
    : 1
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Build posts query with filters
  let postsQuery = supabase
    .from('posts')
    .select(
      `
 *,
 profiles (
 display_name,
 avatar_url
 )
 `,
      { count: 'exact' }
    )
    .eq('status', 'published')
  if (searchQuery) {
    postsQuery = postsQuery.or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`)
  }
  if (authorFilter) {
    postsQuery = postsQuery.eq('author_id', authorFilter)
  }

  // Apply sort order based on sortBy parameter
  // Note: sorting by likes requires the posts_with_likes view to be available
  // For now, we'll always use published_at, and update once view is deployed
  postsQuery = postsQuery.order('published_at', { ascending: false })

  // Lấy bài viết featured (do admin chọn, hoặc fallback to latest)
  let featuredPost: Post | null = null
  if (!searchQuery && !authorName && !authorFilter) {
    // Cố gắng lấy bài được đánh dấu is_featured = true
    const { data: featuredByFlag } = await supabase
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
      .eq('is_featured', true)
      .limit(1)
    
    if (featuredByFlag && featuredByFlag.length > 0) {
      featuredPost = featuredByFlag[0]
    } else {
      // Fallback: lấy bài mới nhất
      const { data: latestPost } = await supabase
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
        .limit(1)
      
      featuredPost = latestPost?.[0] || null
    }
  }

  // Lấy bài viết đã publish theo trang, kèm thông tin author
  const { data: posts, error } = await postsQuery.range(from, to)

  if (error) {
    console.error('Error fetching posts:', error)
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section - Featured Post */}
      {featuredPost && (
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          {/* Background image with overlay */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-950/80 to-transparent z-10"></div>
          </div>

          {/* Hero Content */}
          <div className="relative z-20 mx-auto max-w-7xl px-4 w-full flex items-center gap-12">
            <div className="flex-1 max-w-2xl">
              {/* Category Badge */}
              <div className="inline-flex items-center gap-2 mb-6">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium border border-blue-500/30">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  Bài viết nổi bật
                </span>
              </div>

              {/* Title */}
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                {featuredPost.title}
              </h1>

              {/* Excerpt */}
              {featuredPost.excerpt && (
                <p className="text-lg text-slate-300 mb-8 leading-relaxed line-clamp-3">
                  {featuredPost.excerpt}
                </p>
              )}

              {/* Author Info */}
              <div className="flex items-center gap-4 mb-8">
                {featuredPost.profiles?.avatar_url && (
                  <Image
                    src={featuredPost.profiles.avatar_url}
                    alt={featuredPost.profiles.display_name || 'Author'}
                    width={48}
                    height={48}
                    className="rounded-full object-cover border-2 border-slate-700"
                  />
                )}
                <div>
                  <p className="font-semibold text-white">{featuredPost.profiles?.display_name || 'Ẩn danh'}</p>
                  <p className="text-sm text-slate-400">
                    {featuredPost.published_at
                      ? new Date(featuredPost.published_at).toLocaleDateString('vi-VN')
                      : 'Chưa xuất bản'}
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <Link
                href={`/posts/${featuredPost.slug}`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Đọc bài viết
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Hero Image */}
            <div className="relative hidden lg:flex flex-1 h-96 rounded-xl overflow-hidden shadow-2xl">
              <Image
                src={featuredPost.featured_image_url || 'https://images.unsplash.com/photo-1516321318423-f06f70259b51?w=800&h=600&fit=crop'}
                alt={featuredPost.title}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </section>
      )}

      {/* Search & Filter Section */}
      <section className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 py-6">
        <div className="mx-auto max-w-7xl px-4">
          <form method="get" className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                name="q"
                type="text"
                defaultValue={searchQuery}
                placeholder="Tìm kiếm tiêu đề hoặc nội dung..."
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                name="author_name"
                type="text"
                defaultValue={authorName}
                placeholder="Tên tác giả..."
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                name="sort"
                defaultValue={sortBy}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Mới nhất</option>
                <option value="most_liked">Nổi bật nhất</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm font-medium transition-colors"
              >
                Tìm kiếm
              </button>
              {(searchQuery || authorName || authorFilter) && (
                <Link
                  href="/"
                  className="rounded-lg border border-slate-700 px-6 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Xóa bộ lọc
                </Link>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* Posts Grid Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          {/* Section Title */}
          {!searchQuery && !authorName && !authorFilter && (
            <div className="mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Bài viết khác</h2>
              <p className="text-slate-400">Khám phá những bài viết thú vị từ cộng đồng</p>
            </div>
          )}

          {posts && posts.length > 0 ? (
            <>
              {/* Skip featured post if we're showing it in hero */}
              {!searchQuery && !authorName && !authorFilter && featuredPost ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {posts.filter((post: Post) => post.id !== featuredPost?.id).map((post: Post) => (
                    <article
                      key={post.id}
                      className="group rounded-xl border border-slate-800 bg-slate-800/50 backdrop-blur overflow-hidden hover:border-slate-700 transition-all hover:shadow-xl hover:shadow-blue-500/10"
                    >
                      {/* Post Image */}
                      <div className="relative aspect-video bg-linear-to-br from-slate-700 to-slate-900 flex items-center justify-center overflow-hidden">
                        {post.featured_image_url ? (
                          <Image
                            src={post.featured_image_url}
                            alt={post.title}
                            fill
                            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-4xl group-hover:scale-110 transition-transform">🎨</div>
                        )}
                      </div>

                      {/* Post Content */}
                      <div className="p-6">
                        <Link href={`/posts/${post.slug}`}>
                          <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-3">
                            {post.title}
                          </h3>
                        </Link>

                        {post.excerpt && (
                          <p className="text-slate-400 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                        )}

                        {/* Meta Info */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400">
                              {post.profiles?.display_name || 'Ẩn danh'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {post.published_at
                              ? new Date(post.published_at).toLocaleDateString('vi-VN')
                              : 'Chưa xuất bản'}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {posts.map((post: Post) => (
                    <article
                      key={post.id}
                      className="group rounded-xl border border-slate-800 bg-slate-800/50 backdrop-blur overflow-hidden hover:border-slate-700 transition-all hover:shadow-xl hover:shadow-blue-500/10"
                    >
                      {/* Post Image */}
                      <div className="relative aspect-video bg-linear-to-br from-slate-700 to-slate-900 flex items-center justify-center overflow-hidden">
                        {post.featured_image_url ? (
                          <Image
                            src={post.featured_image_url}
                            alt={post.title}
                            fill
                            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-4xl group-hover:scale-110 transition-transform">🎨</div>
                        )}
                      </div>

                      {/* Post Content */}
                      <div className="p-6">
                        <Link href={`/posts/${post.slug}`}>
                          <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-3">
                            {post.title}
                          </h3>
                        </Link>

                        {post.excerpt && (
                          <p className="text-slate-400 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                        )}

                        {/* Meta Info */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400">
                              {post.profiles?.display_name || 'Ẩn danh'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {post.published_at
                              ? new Date(post.published_at).toLocaleDateString('vi-VN')
                              : 'Chưa xuất bản'}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-16 flex items-center justify-center gap-4">
                  {currentPage > 1 ? (
                    <Link
                      href={
                        searchQuery || authorName || authorFilter || sortBy !== 'newest'
                          ? `/?${new URLSearchParams({
                              ...(searchQuery && { q: searchQuery }),
                              ...(authorName && { author_name: authorName }),
                              ...(authorFilter && { author_id: authorFilter }),
                              ...(sortBy !== 'newest' && { sort: sortBy }),
                              page: String(currentPage - 1),
                            }).toString()}`
                          : currentPage - 1 === 1
                            ? '/'
                            : `/?page=${currentPage - 1}`
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Trang trước
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-500 text-sm font-medium cursor-not-allowed">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Trang trước
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">
                      Trang <span className="font-bold text-slate-100">{currentPage}</span> /{' '}
                      <span className="font-bold text-slate-100">{totalPages}</span>
                    </span>
                  </div>

                  {currentPage < totalPages ? (
                    <Link
                      href={
                        searchQuery || authorName || authorFilter || sortBy !== 'newest'
                          ? `/?${new URLSearchParams({
                              ...(searchQuery && { q: searchQuery }),
                              ...(authorName && { author_name: authorName }),
                              ...(authorFilter && { author_id: authorFilter }),
                              ...(sortBy !== 'newest' && { sort: sortBy }),
                              page: String(currentPage + 1),
                            }).toString()}`
                          : `/?page=${currentPage + 1}`
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-medium transition-colors"
                    >
                      Trang sau
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-500 text-sm font-medium cursor-not-allowed">
                      Trang sau
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  )}
                </nav>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-800/50 py-16 text-center">
              <svg className="mx-auto h-12 w-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4" />
              </svg>
              <p className="mt-4 text-lg text-slate-300">
                {searchQuery || authorName || authorFilter ? 'Không tìm thấy bài viết nào' : 'Chưa có bài viết nào'}
              </p>
              <p className="mt-1 text-sm text-slate-400">Hãy quay lại sau nhé!</p>
              {(searchQuery || authorName || authorFilter) && (
                <div className="mt-4">
                  <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                    Xóa bộ lọc và xem tất cả
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
