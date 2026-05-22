import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PostForm } from '@/components/dashboard/post-form'

interface EditPostPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .eq('author_id', user.id) // Chỉ cho phép edit bài của mình
    .single()

  if (error || !post) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 py-10 lg:py-14">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">Dashboard</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-100">Chỉnh sửa bài viết</h1>
          <p className="mt-3 text-base leading-7 text-slate-300">
            Tối ưu lại tiêu đề, tóm tắt và nội dung của bài viết một cách trực quan.
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <PostForm post={post} />
        </div>
      </div>
    </main>
  )
}
