'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

export function RegisterForm() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        if (data.session) {
          const profileResult = await supabase.from('profiles').upsert(
            {
              id: data.user.id,
              display_name: displayName.trim() || email.split('@')[0],
              avatar_url: null,
            },
            { onConflict: 'id' }
          )

          if (profileResult.error) {
            setError(profileResult.error.message)
            return
          }
        }

          // Log registration event (server will read user-agent)
          try {
            await fetch('/api/auth/log-login', { method: 'POST', body: JSON.stringify({ event: 'register' }) })
          } catch (e) {
            // ignore logging errors
          }

          router.push(
            '/login?message=Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.'
          )
      }
    } catch {
      setError('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleRegister} className="mt-8 space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-medium text-red-400">{error}</div>
      ) : null}

      <div className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-semibold text-slate-200">
            Tên hiển thị
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 shadow-sm placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="Nguyễn Văn A"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-slate-200">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 shadow-sm placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-slate-200">
            Mật khẩu
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 shadow-sm placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="••••••••"
          />
          <p className="mt-1 text-xs font-medium text-slate-400">Tối thiểu 6 ký tự</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full justify-center rounded-lg border border-transparent bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
      >
        {loading ? 'Đang xử lý...' : 'Đăng ký'}
      </button>

      <p className="text-center text-sm text-slate-400">
        Đã có tài khoản?{' '}
        <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
          Đăng nhập
        </Link>
      </p>
    </form>
  )
}
