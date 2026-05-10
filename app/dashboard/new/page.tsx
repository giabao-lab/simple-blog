import { PostForm } from '@/components/dashboard/post-form'

export default function NewPostPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 bg-white">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Viết bài mới</h1>
      <div className="mx-auto max-w-2xl">
        <PostForm />
      </div>
    </main>
  )
}
