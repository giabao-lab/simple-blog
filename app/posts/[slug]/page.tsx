import Link from 'next/link'
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
    .select('title, excerpt')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  return {
    title: post?.title || 'Bài viết',
    description: post?.excerpt || '',
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post, error } = await supabase
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
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !post) {
    // Try to fetch the post ignoring status to provide a friendlier message
    const { data: maybePost } = await supabase.from('posts').select('*').eq('slug', slug).single()

    if (!maybePost) {
      notFound()
    }

    // If we found a post but it's not published, show a helpful message.
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900">{maybePost.title}</h1>
          <p className="mt-4 text-gray-700">Bài viết này chưa được xuất bản.</p>
          <div className="mt-6">
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              ← Quay lại dashboard
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const { data: comments } = await supabase
    .from('comments')
    .select(
      `
*,
profiles (
display_name,
avatar_url
)
`
    )
    .eq('post_id', post.id)
    .order('created_at', { ascending: true })

  const { count: likeCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', post.id)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: currentLike } = user
    ? await supabase.from('likes').select('post_id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle()
    : { data: null }

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-50 to-white py-10 lg:py-14">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600">
            <span>←</span>
            Quay lại danh sách
          </Link>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">Bài viết</span>
        </div>

        <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/70">
          <div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-white px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{post.title}</h1>
                {post.excerpt ? <p className="mt-3 text-base leading-7 text-gray-600">{post.excerpt}</p> : null}
              </div>

              <div className="rounded-2xl bg-white/90 px-4 py-3 text-sm text-gray-600 shadow-sm ring-1 ring-gray-200 backdrop-blur">
                <div className="font-semibold text-gray-900">{post.profiles?.display_name || 'Ẩn danh'}</div>
                <div className="mt-1">
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : ''}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {user ? (
                <LikeButton postId={post.id} initialLikeCount={likeCount ?? 0} initialIsLiked={!!currentLike} />
              ) : (
                <div className="inline-flex items-center gap-3 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  <span>{likeCount ?? 0} lượt thích</span>
                  <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                    Đăng nhập để thích
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-8 sm:px-8">
            <div className="prose max-w-none prose-headings:tracking-tight prose-a:text-blue-600 prose-img:rounded-2xl prose-img:shadow-lg text-gray-800">
              {post.content ? <ReactMarkdown>{post.content}</ReactMarkdown> : <p>Nội dung trống</p>}
            </div>
          </div>
        </article>

        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/70">
          <div className="border-b border-gray-200 px-6 py-6 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Bình luận</h2>
                <p className="mt-1 text-sm text-gray-500">Trao đổi cùng tác giả và độc giả khác</p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                {comments?.length || 0} bình luận
              </span>
            </div>
          </div>

          <div className="px-6 py-8 sm:px-8">
            {user ? (
              <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
                <CommentForm postId={post.id} />
              </div>
            ) : (
              <div className="mb-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600">
                <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
                  Đăng nhập
                </Link>{' '}
                để bình luận.
              </div>
            )}

            <RealtimeComments postId={post.id} initialComments={comments ?? []} />
          </div>
        </section>
      </div>
    </main>
  )
}
