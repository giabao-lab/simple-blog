import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'

export async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null }

  const isAdmin = profile?.role === 'admin'

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white hover:text-blue-400 transition-colors">
            Simple Blog
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="/" className="text-slate-300 hover:text-white transition-colors">
              Trang chủ
            </Link>

            {user ? (
              <>
                <Link href="/profile" className="text-slate-300 hover:text-white transition-colors">
                  Profile
                </Link>
                <Link href="/dashboard" className="text-slate-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
                {isAdmin ? (
                  <Link
                    href="/admin"
                    className="rounded-lg bg-amber-500 hover:bg-amber-600 px-4 py-2 text-white font-medium transition-colors"
                  >
                    Admin
                  </Link>
                ) : null}
                <form action={logout}>
                  <button type="submit" className="text-slate-300 hover:text-white transition-colors">
                    Đăng xuất
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="text-slate-300 hover:text-white transition-colors">
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white font-medium transition-colors"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
