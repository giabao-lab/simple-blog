import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur p-8 shadow-xl shadow-blue-500/10">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Đăng ký tài khoản</h2>
          <p className="mt-2 text-base text-slate-400">Tạo tài khoản để bắt đầu viết blog</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
