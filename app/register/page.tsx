import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-slate-900">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">Đăng ký tài khoản</h2>
          <p className="mt-2 text-base text-slate-700">Tạo tài khoản để bắt đầu viết blog</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
