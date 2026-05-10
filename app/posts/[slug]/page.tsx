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
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
          <div className="text-sm text-gray-600">
            <div>{post.profiles?.display_name || 'Ẩn danh'}</div>
            <div>
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

        {post.excerpt ? <p className="mb-4 text-gray-700">{post.excerpt}</p> : null}

        <div className="mb-6">
          {user ? (
            <LikeButton postId={post.id} initialLikeCount={likeCount ?? 0} initialIsLiked={!!currentLike} />
          ) : (
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <span>{likeCount ?? 0} lượt thích</span>
              <Link href="/login" className="text-blue-600 hover:text-blue-500">
                Đăng nhập để thích
              </Link>
            </div>
          )}
        </div>

        <div className="prose max-w-none text-gray-800">
          {post.content ? <ReactMarkdown>{post.content}</ReactMarkdown> : <p>Nội dung trống</p>}
        </div>

        <footer className="mt-8">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Quay lại danh sách
          </Link>
        </footer>
      </div>

      <section className="mt-8 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Bình luận ({comments?.length || 0})</h2>

        {user ? (
          <div className="mb-8">
            <CommentForm postId={post.id} />
          </div>
        ) : (
          <p className="mb-8 text-gray-500">
            <Link href="/login" className="text-blue-600 hover:text-blue-500">
              Đăng nhập
            </Link>{' '}
            để bình luận.
          </p>
        )}

        <RealtimeComments postId={post.id} initialComments={comments ?? []} />
      </section>
    </main>
  )
}
