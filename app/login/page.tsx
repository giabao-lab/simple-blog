import { LoginForm } from '@/components/auth/login-form'

type LoginPageProps = {
  searchParams?: Promise<{
    message?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const message = resolvedSearchParams?.message

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur p-8 shadow-xl shadow-blue-500/10">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Đăng nhập</h2>
          <p className="mt-2 text-base text-slate-400">Đăng nhập để quản lý blog của bạn</p>
        </div>

        {message ? (
          <div className="rounded-lg bg-green-500/20 p-3 text-sm text-green-400 border border-green-500/30">{message}</div>
        ) : null}

        <LoginForm />
      </div>
    </div>
  )
}
