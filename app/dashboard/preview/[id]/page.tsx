import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'

interface Params {
  params: Promise<{ id: string }>
}

export default async function PreviewPage({ params }: Params) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // params is a Promise in this route; await it to get the id
  const resolved = await params
  const id = resolved.id

  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !post) {
    notFound()
  }

  // Only author can view drafts here
  if (post.author_id !== user.id && post.status !== 'published') {
    notFound()
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/edit/${post.id}`} className="text-blue-600 hover:underline">
              Chỉnh sửa
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:underline">
              Quay về
            </Link>
          </div>
        </div>

        {post.excerpt ? <p className="mb-4 text-gray-700">{post.excerpt}</p> : null}

        <div className="prose max-w-none text-gray-800">
          <ReactMarkdown>{post.content || ''}</ReactMarkdown>
        </div>
      </div>
    </main>
  )
}
