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
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Profile của tôi</h1>
        <p className="mt-2 text-gray-600">Xem và chỉnh sửa thông tin profile cá nhân.</p>
      </div>

      <ProfileForm
        userId={user.id}
        initialDisplayName={profile?.display_name ?? null}
        initialAvatarUrl={profile?.avatar_url ?? null}
      />
    </main>
  )
}
