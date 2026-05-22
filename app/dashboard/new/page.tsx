import { PostForm } from '@/components/dashboard/post-form'

export default function NewPostPage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 py-10 lg:py-14">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">Dashboard</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-100">Viết bài mới</h1>
          <p className="mt-3 text-base leading-7 text-slate-300">
            Tạo bài viết với bố cục rõ ràng, thao tác nhanh và giao diện dễ đọc.
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <PostForm />
        </div>
      </div>
    </main>
  )
}
