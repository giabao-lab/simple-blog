import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    // record login for oauth
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        await supabase.from('user_login_history').insert({
          user_id: userData.user.id,
          event_type: 'oauth',
          user_agent: null,
        })
      }
    } catch (e) {
      // ignore logging failures
    }
  }

  // Redirect về dashboard sau khi đăng nhập thành công
  return NextResponse.redirect(`${origin}/dashboard`)
}
