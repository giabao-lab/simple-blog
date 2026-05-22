import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    if (data.user) {
      await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          display_name:
            data.user.user_metadata?.display_name ||
            data.user.user_metadata?.name ||
            data.user.email?.split('@')[0] ||
            'User',
          avatar_url: null,
        },
        { onConflict: 'id' }
      )
    }
  }

  // Redirect về dashboard sau khi đăng nhập thành công
  return NextResponse.redirect(`${origin}/dashboard`)
}
