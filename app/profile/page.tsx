import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/profile-form'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-50 to-white py-12">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Thông tin cá nhân</h1>
          <p className="mt-3 text-lg text-gray-600">Quản lý và chỉnh sửa thông tin profile của bạn</p>
        </div>

        {/* Main Content Card */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-md overflow-hidden">
          {/* Profile Header with Avatar Background */}
          <div className="h-32 bg-linear-to-r from-blue-500 to-blue-600"></div>

          {/* Profile Content */}
          <div className="px-8 pb-8">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-16 mb-8 relative z-10">
              <div className="shrink-0">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="h-32 w-32 rounded-lg border-4 border-white shadow-lg object-cover bg-gray-100"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-lg border-4 border-white shadow-lg bg-gray-300 flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{profile?.display_name || 'Người dùng ẩn danh'}</h2>
                <p className="mt-1 text-sm text-gray-500">Email: {user.email}</p>
                <p className="mt-1 text-sm text-gray-500">ID: {user.id}</p>
              </div>
            </div>

            <hr className="my-8 border-gray-200" />

            {/* Form Section */}
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Chỉnh sửa thông tin</h3>
              <ProfileForm
                userId={user.id}
                initialDisplayName={profile?.display_name ?? null}
                initialAvatarUrl={profile?.avatar_url ?? null}
              />
            </div>
          </div>
        </div>

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Account Security Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Bảo mật tài khoản</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Đổi mật khẩu hoặc quản lý phiên đăng nhập của bạn</p>
            <Link href="/forgot-password" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm">
              Quản lý bảo mật
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Activity Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Hoạt động</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Xem lịch sử đăng nhập và hoạt động của bạn</p>
            <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm">
              Xem bài viết của tôi
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
