import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Đặt lại mật khẩu</h2>
          <p className="mt-2 text-gray-600">Nhập mật khẩu mới của bạn</p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
