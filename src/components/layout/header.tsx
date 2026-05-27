import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import { NotificationBell } from './notification-bell'

export async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('role, display_name').eq('id', user.id).single()
    : { data: null }

  const isAdmin = profile?.role === 'admin'

  return (
    <header className="sticky top-0 z-50 bg-slate-950/70 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 hover:opacity-80 transition-opacity">
            LGBlog
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="/" className="text-slate-300 hover:text-white transition-colors">
              Trang chủ
            </Link>

            {user ? (
              <>
                <NotificationBell />
                <Link href="/profile" className="text-slate-300 hover:text-white transition-colors flex items-center gap-2">
                  <span>{profile?.display_name || 'Hồ sơ'}</span>
                </Link>
                <Link href="/dashboard" className="text-slate-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
                {isAdmin ? (
                  <Link
                    href="/admin"
                    className="rounded-full bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-4 py-2 text-white text-sm font-semibold shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-0.5"
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
                  className="rounded-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-5 py-2 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5"
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
