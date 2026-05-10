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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Đăng nhập</h2>
          <p className="mt-2 text-gray-600">Đăng nhập để quản lý blog của bạn</p>
        </div>

        {message ? (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{message}</div>
        ) : null}

        <LoginForm />
      </div>
    </div>
  )
}
