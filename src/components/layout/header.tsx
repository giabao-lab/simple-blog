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
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'rgba(2,6,23,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 1px 40px rgba(0,0,0,0.4)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-black tracking-tight shrink-0 transition-opacity hover:opacity-80"
            style={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 50%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            LGBlog
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5"
            >
              Trang chủ
            </Link>

            {user ? (
              <>
                <NotificationBell />

                <Link
                  href="/profile"
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(99,102,241,0.25)', color: '#a5b4fc' }}
                  >
                    {(profile?.display_name || 'U')[0].toUpperCase()}
                  </div>
                  <span>{profile?.display_name || 'Hồ sơ'}</span>
                </Link>

                <Link
                  href="/dashboard"
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5"
                >
                  Dashboard
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                      color: '#fff',
                      boxShadow: '0 4px 15px rgba(245,158,11,0.25)',
                    }}
                  >
                    Admin
                  </Link>
                )}

                <form action={logout}>
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-500 hover:text-red-400 hover:bg-red-500/5"
                  >
                    Đăng xuất
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 text-white"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                  }}
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
