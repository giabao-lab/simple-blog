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

  postsQuery = postsQuery.order('published_at', { ascending: false })

  // Lấy bài viết featured
  let featuredPost: Post | null = null
  if (!searchQuery && !authorName && !authorFilter) {
    const { data: featuredByFlag } = await supabase
      .from('posts')
      .select(`*, profiles (display_name, avatar_url)`)
      .eq('status', 'published')
      .eq('is_featured', true)
      .limit(1)
    
    if (featuredByFlag && featuredByFlag.length > 0) {
      featuredPost = featuredByFlag[0]
    } else {
      const { data: latestPost } = await supabase
        .from('posts')
        .select(`*, profiles (display_name, avatar_url)`)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1)
      
      featuredPost = latestPost?.[0] || null
    }
  }

  const { data: posts, error } = await postsQuery.range(from, to)

  if (error) {
    console.error('Error fetching posts:', error)
  }

  // Reusable post card component
  const PostCard = ({ post }: { post: Post }) => (
    <article className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(99,102,241,0.15)]"
      style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Hover Glow Border */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))', border: '1px solid rgba(139,92,246,0.3)' }} />

      {/* Post Image */}
      <div className="relative aspect-video overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
        {post.featured_image_url ? (
          <Image
            src={post.featured_image_url}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl group-hover:scale-110 transition-transform duration-300 opacity-60">📝</span>
          </div>
        )}
        {/* Image overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Post Content */}
      <div className="p-5 relative z-10">
        <Link href={`/posts/${post.slug}`}>
          <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors duration-300 line-clamp-2 mb-2 leading-snug">
            {post.title}
          </h3>
        </Link>

        {post.excerpt && (
          <p className="text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">{post.excerpt}</p>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between pt-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-indigo-300"
              style={{ background: 'rgba(99,102,241,0.2)' }}>
              {(post.profiles?.display_name || 'A')[0].toUpperCase()}
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {post.profiles?.display_name || 'Ẩn danh'}
            </span>
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString('vi-VN')
              : 'Chưa xuất bản'}
          </span>
        </div>
      </div>
    </article>
  )

  return (
    <main className="min-h-screen relative overflow-hidden" style={{ background: '#020617' }}>
      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-10%] left-[30%] w-[700px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', filter: 'blur(100px)' }} />
      </div>


      {/* ── Welcome Hero ─────────────────────────────────── */}
      <section className="relative z-10 flex items-center justify-center overflow-hidden" style={{ minHeight: '70vh' }}>
        {/* Decorative grid lines */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />

        {/* Centre glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, #6366f1 0%, transparent 70%)', filter: 'blur(60px)' }} />

        <div className="relative text-center px-4 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-8">
            <span className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              Est. 2025 · Technology Blog
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight mb-6 leading-none">
            <span style={{
              background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 40%, #6366f1 70%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Welcome to
            </span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              LGBlog
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: '#64748b' }}>
            A space for sharing programming knowledge, technology insights,
            and ideas that matter.
          </p>

          {/* CTA row */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="#posts"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white transition-all hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Explore Articles
            </Link>
            <Link href="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold transition-all hover:-translate-y-1"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
              Start Writing
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-black" style={{ color: '#f1f5f9' }}>{totalPosts}</p>
              <p className="text-xs uppercase tracking-wider mt-1" style={{ color: '#475569' }}>Articles</p>
            </div>
            <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="text-center">
              <p className="text-3xl font-black" style={{ color: '#f1f5f9' }}>100%</p>
              <p className="text-xs uppercase tracking-wider mt-1" style={{ color: '#475569' }}>Free</p>
            </div>
            <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="text-center">
              <p className="text-3xl font-black" style={{ color: '#f1f5f9' }}>∞</p>
              <p className="text-xs uppercase tracking-wider mt-1" style={{ color: '#475569' }}>Ideas</p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce">
          <span className="text-[10px] tracking-widest uppercase" style={{ color: '#334155' }}>Scroll</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#334155' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Hero Section - Featured Post */}
      {featuredPost && (
        <section className="relative min-h-[92vh] flex items-center overflow-hidden">
          {/* Hero background image */}
          {featuredPost.featured_image_url && (
            <div className="absolute inset-0 z-0">
              <Image
                src={featuredPost.featured_image_url}
                alt={featuredPost.title}
                fill
                sizes="100vw"
                className="object-cover opacity-20"
                priority
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #020617 40%, rgba(2,6,23,0.85) 100%)' }} />
            </div>
          )}

          {/* Hero Content */}
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Text content */}
              <div className="space-y-6">
                {/* Badge */}
                <div className="inline-flex items-center gap-2">
                  <span className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase"
                    style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    Bài viết nổi bật
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight"
                  style={{ color: '#f1f5f9' }}>
                  <span style={{ background: 'linear-gradient(135deg, #f1f5f9, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {featuredPost.title}
                  </span>
                </h1>

                {/* Excerpt */}
                {featuredPost.excerpt && (
                  <p className="text-lg leading-relaxed line-clamp-3" style={{ color: '#94a3b8' }}>
                    {featuredPost.excerpt}
                  </p>
                )}

                {/* Author Info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                    style={{ border: '2px solid rgba(99,102,241,0.4)' }}>
                    {featuredPost.profiles?.avatar_url ? (
                      <Image
                        src={featuredPost.profiles.avatar_url}
                        alt={featuredPost.profiles.display_name || 'Author'}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold text-indigo-300"
                        style={{ background: 'rgba(99,102,241,0.2)' }}>
                        {(featuredPost.profiles?.display_name || 'A')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>
                      {featuredPost.profiles?.display_name || 'Ẩn danh'}
                    </p>
                    <p className="text-xs" style={{ color: '#64748b' }}>
                      {featuredPost.published_at
                        ? new Date(featuredPost.published_at).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
                        : 'Chưa xuất bản'}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-4 pt-2">
                  <Link
                    href={`/posts/${featuredPost.slug}`}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5 text-white"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      boxShadow: '0 0 30px rgba(99,102,241,0.4)',
                    }}
                  >
                    Đọc bài viết
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Right: Featured image */}
              <div className="relative hidden lg:block">
                <div className="relative h-[420px] rounded-3xl overflow-hidden"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
                  <Image
                    src={featuredPost.featured_image_url || 'https://images.unsplash.com/photo-1516321318423-f06f70259b51?w=800&h=600&fit=crop'}
                    alt={featuredPost.title}
                    fill
                    sizes="50vw"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(2,6,23,0.8) 100%)' }} />
                </div>
                {/* Decorative glow under image */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 rounded-full opacity-40"
                  style={{ background: 'radial-gradient(ellipse, #6366f1 0%, transparent 70%)', filter: 'blur(20px)' }} />
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce">
            <span className="text-xs text-slate-500 tracking-widest uppercase">Cuộn xuống</span>
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </section>
      )}

      {/* Search & Filter Bar */}
      <section className="sticky top-16 z-40 py-3"
        style={{ background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <form method="get" className="flex flex-col sm:flex-row gap-2">
            <input
              name="q"
              type="text"
              defaultValue={searchQuery}
              placeholder="🔍 Tìm kiếm bài viết..."
              className="flex-1 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <input
              name="author_name"
              type="text"
              defaultValue={authorName}
              placeholder="👤 Tên tác giả..."
              className="flex-1 sm:max-w-[200px] rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <select
              name="sort"
              defaultValue={sortBy}
              className="rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none cursor-pointer"
              style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <option value="newest">Mới nhất</option>
              <option value="most_liked">Nổi bật nhất</option>
            </select>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}
              >
                Tìm kiếm
              </button>
              {(searchQuery || authorName || authorFilter) && (
                <Link
                  href="/"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Xóa bộ lọc
                </Link>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* Posts Grid Section */}
      <section className="relative z-10 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          {!searchQuery && !authorName && !authorFilter && (
            <div className="mb-12 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#6366f1' }}>
                  KHÁM PHÁ
                </p>
                <h2 className="text-3xl sm:text-4xl font-black" style={{ color: '#f1f5f9' }}>
                  Bài viết mới nhất
                </h2>
              </div>
              <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                {totalPosts} bài viết
              </div>
            </div>
          )}

          {posts && posts.length > 0 ? (
            <>
              {!searchQuery && !authorName && !authorFilter && featuredPost ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.filter((post: Post) => post.id !== featuredPost?.id).map((post: Post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post: Post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-16 flex items-center justify-center gap-3">
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
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                      style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Trước
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed opacity-30"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748b' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Trước
                    </span>
                  )}

                  <div className="px-4 py-2.5 rounded-xl text-sm"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                    <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{currentPage}</span>
                    {' / '}
                    <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{totalPages}</span>
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
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                      style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}
                    >
                      Sau
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed opacity-30"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748b' }}>
                      Sau
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  )}
                </nav>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ color: '#6366f1' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-lg font-semibold mb-2" style={{ color: '#e2e8f0' }}>
                {searchQuery || authorName || authorFilter ? 'Không tìm thấy bài viết nào' : 'Chưa có bài viết nào'}
              </p>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>
                {searchQuery || authorName || authorFilter ? 'Thử thay đổi bộ lọc tìm kiếm của bạn.' : 'Hãy quay lại sau nhé!'}
              </p>
              {(searchQuery || authorName || authorFilter) && (
                <Link href="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}>
                  Xóa bộ lọc
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-10 mt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-black tracking-tight" style={{ background: 'linear-gradient(135deg, #60a5fa, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            LGBlog
          </p>
          <p className="text-xs" style={{ color: '#475569' }}>
            © {new Date().getFullYear()} LGBlog. Built with Next.js & Supabase.
          </p>
        </div>
      </footer>
    </main>
  )
}
