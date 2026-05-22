import Link from 'next/link'

export default function ForbiddenPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-2xl rounded-2xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold text-gray-900">403 — Forbidden</h1>
        <p className="mt-4 text-gray-600">Bạn không có quyền truy cập trang này.</p>
        <div className="mt-6">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>
    </main>
  )
}
