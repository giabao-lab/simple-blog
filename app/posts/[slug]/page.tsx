import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ReactMarkdown from 'react-markdown'
import { CommentForm } from '@/components/posts/comment-form'
import { RealtimeComments } from '@/components/posts/realtime-comments'
import { LikeButton } from '@/components/posts/like-button'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('title, excerpt, featured_image_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  return {
    title: post?.title ? `${post.title} | LGBlog` : 'LGBlog',
    description: post?.excerpt || '',
    openGraph: {
      title: post?.title || 'LGBlog',
      description: post?.excerpt || '',
      images: post?.featured_image_url ? [post.featured_image_url] : [],
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select(`*, profiles (display_name, avatar_url)`)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !post) {
    const { data: maybePost } = await supabase.from('posts').select('*').eq('slug', slug).single()
    if (!maybePost) notFound()

    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: '#020617' }}>
        <div className="max-w-md w-full rounded-2xl p-8 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(99,102,241,0.1)' }}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6366f1' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: '#f1f5f9' }}>{maybePost.title}</h1>
          <p className="text-sm mb-6" style={{ color: '#64748b' }}>Bài viết này chưa được xuất bản.</p>
          <Link href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            ← Quay lại dashboard
          </Link>
        </div>
      </main>
    )
  }

  const { data: comments } = await supabase
    .from('comments')
    .select(`*, profiles (display_name, avatar_url)`)
    .eq('post_id', post.id)
    .order('created_at', { ascending: true })

  const { count: likeCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', post.id)

  const { data: { user } } = await supabase.auth.getUser()

  const { data: currentLike } = user
    ? await supabase.from('likes').select('post_id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle()
    : { data: null }

  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  // Estimate reading time (avg 200 words/min)
  const wordCount = post.content ? post.content.split(/\s+/).length : 0
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <main className="min-h-screen relative" style={{ background: '#020617' }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      {/* ── Hero Banner ──────────────────────────────────── */}
      <div className="relative z-10">
        {post.featured_image_url && (
          <div className="absolute inset-0 h-[420px] overflow-hidden">
            <Image
              src={post.featured_image_url}
              alt={post.title}
              fill
              sizes="100vw"
              className="object-cover opacity-15"
              priority
            />
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(to bottom, rgba(2,6,23,0.3) 0%, #020617 100%)' }} />
          </div>
        )}

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-10 pb-0">
          {/* Back navigation */}
          <div className="flex items-center justify-between mb-10">
            <Link href="/"
              className="inline-flex items-center gap-2 text-sm font-medium transition-all hover:-translate-x-1"
              style={{ color: '#64748b' }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#a5b4fc')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#64748b')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Trang chủ
            </Link>
            <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
              Bài viết
            </span>
          </div>

          {/* Post title block */}
          <div className="mb-8">
            {/* Tags/Category placeholder */}
            <div className="flex items-center gap-2 mb-5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
                style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                Công nghệ
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-5 tracking-tight"
              style={{ color: '#f1f5f9' }}>
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-lg leading-relaxed mb-6" style={{ color: '#94a3b8', maxWidth: '680px' }}>
                {post.excerpt}
              </p>
            )}

            {/* Author + meta row */}
            <div className="flex flex-wrap items-center gap-4 pb-6"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                  style={{ border: '2px solid rgba(99,102,241,0.3)' }}>
                  {post.profiles?.avatar_url ? (
                    <Image
                      src={post.profiles.avatar_url}
                      alt={post.profiles.display_name || 'Author'}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold"
                      style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                      {(post.profiles?.display_name || 'A')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
                    {post.profiles?.display_name || 'Ẩn danh'}
                  </p>
                  {publishedDate && (
                    <p className="text-xs" style={{ color: '#64748b' }}>{publishedDate}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 ml-auto">
                {/* Read time */}
                <div className="flex items-center gap-1.5 text-xs" style={{ color: '#64748b' }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {readingTime} phút đọc
                </div>
                {/* Like */}
                {user ? (
                  <LikeButton postId={post.id} initialLikeCount={likeCount ?? 0} initialIsLiked={!!currentLike} />
                ) : (
                  <Link href="/login"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:-translate-y-0.5"
                    style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', color: '#f472b6' }}>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    {likeCount ?? 0}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Featured image full width */}
        {post.featured_image_url && (
          <div className="relative w-full h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden mb-12"
            style={{ border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <Image
              src={post.featured_image_url}
              alt={post.title}
              fill
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Article body */}
        <div className="grid lg:grid-cols-[1fr_240px] gap-12 items-start">
          {/* Main content */}
          <div>
            <article
              className="prose prose-lg prose-invert max-w-none
                prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-100
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-slate-300 prose-p:leading-8 prose-p:my-5
                prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:text-indigo-300
                prose-strong:text-slate-100 prose-strong:font-bold
                prose-code:text-purple-300 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-normal
                prose-pre:bg-slate-900 prose-pre:border prose-pre:border-white/8 prose-pre:rounded-2xl prose-pre:p-5
                prose-blockquote:border-l-indigo-500 prose-blockquote:text-slate-400 prose-blockquote:bg-white/2 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-xl
                prose-img:rounded-2xl prose-img:shadow-2xl prose-img:border prose-img:border-white/8
                prose-ul:text-slate-300 prose-ol:text-slate-300
                prose-li:my-1
                prose-hr:border-white/8"
            >
              {post.content ? <ReactMarkdown>{post.content}</ReactMarkdown> : <p>Nội dung trống.</p>}
            </article>

            {/* Bottom action bar */}
            <div className="mt-12 flex flex-wrap items-center justify-between gap-4 pt-6"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                {user ? (
                  <LikeButton postId={post.id} initialLikeCount={likeCount ?? 0} initialIsLiked={!!currentLike} />
                ) : (
                  <Link href="/login"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5"
                    style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', color: '#f472b6' }}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    Thích bài viết
                  </Link>
                )}
              </div>
              <Link href="/"
                className="inline-flex items-center gap-2 text-sm font-medium transition-all hover:-translate-x-1"
                style={{ color: '#64748b' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Quay lại trang chủ
              </Link>
            </div>
          </div>

          {/* Sidebar: Author card */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-5">
              {/* Author card */}
              <div className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#475569' }}>
                  Tác giả
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
                    style={{ border: '2px solid rgba(99,102,241,0.3)' }}>
                    {post.profiles?.avatar_url ? (
                      <Image
                        src={post.profiles.avatar_url}
                        alt={post.profiles.display_name || 'Author'}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-base font-black"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
                        {(post.profiles?.display_name || 'A')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#f1f5f9' }}>
                      {post.profiles?.display_name || 'Ẩn danh'}
                    </p>
                    <p className="text-xs" style={{ color: '#64748b' }}>Tác giả</p>
                  </div>
                </div>
              </div>

              {/* Post info card */}
              <div className="rounded-2xl p-5 space-y-3"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#475569' }}>
                  Thông tin
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: '#64748b' }}>Ngày đăng</span>
                  <span className="font-medium" style={{ color: '#cbd5e1' }}>{publishedDate || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: '#64748b' }}>Thời gian đọc</span>
                  <span className="font-medium" style={{ color: '#cbd5e1' }}>{readingTime} phút</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: '#64748b' }}>Lượt thích</span>
                  <span className="font-medium" style={{ color: '#cbd5e1' }}>{likeCount ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: '#64748b' }}>Bình luận</span>
                  <span className="font-medium" style={{ color: '#cbd5e1' }}>{comments?.length ?? 0}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* ── Comments ─────────────────────────────────────── */}
        <section className="mt-20 mb-16">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-black" style={{ color: '#f1f5f9' }}>Bình luận</h2>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
              {comments?.length || 0}
            </span>
          </div>

          {/* Comment form */}
          {user ? (
            <div className="mb-8 rounded-2xl p-5 sm:p-6"
              style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#6366f1' }}>
                Viết bình luận
              </p>
              <CommentForm postId={post.id} />
            </div>
          ) : (
            <div className="mb-8 rounded-2xl p-6 flex items-center justify-between"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
              <p className="text-sm" style={{ color: '#64748b' }}>
                Bạn cần đăng nhập để bình luận.
              </p>
              <Link href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                Đăng nhập
              </Link>
            </div>
          )}

          {/* Comments list */}
          <RealtimeComments postId={post.id} initialComments={comments ?? []} />
        </section>
      </div>
    </main>
  )
}
