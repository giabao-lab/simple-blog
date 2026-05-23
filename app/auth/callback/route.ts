import { createClient } from '@/lib/supabase/server'
import { logUserEvent } from '@/lib/user-event-logger'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    // Log OAuth login
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        await logUserEvent(
          userData.user.id,
          'login',
          request.headers.get('user-agent') || undefined,
          request.headers.get('x-forwarded-for')?.split(',')[0].trim() || undefined,
          { method: 'oauth' }
        )
      }
    } catch (e) {
      // ignore logging failures
      console.error('Error logging login:', e)
    }
  }

  // Redirect về dashboard sau khi đăng nhập thành công
  return NextResponse.redirect(`${origin}/dashboard`)
}
