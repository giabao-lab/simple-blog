import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (!code) {
    // No code → redirect to login with a query param
    return NextResponse.redirect(`${origin}/login?error=missing_code`, 302)
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[auth/callback] exchangeCodeForSession error:', error)
      return NextResponse.redirect(`${origin}/login?error=oauth_exchange_failed`, 302)
    }

    // If a user was returned, ensure profile exists (safe-upsert)
    if (data?.user) {
      try {
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
      } catch (upsertErr) {
        // Non-fatal: log but continue to redirect so user can login
        console.error('[auth/callback] profile upsert error:', upsertErr)
      }
    }

    // Success — redirect to dashboard
    return NextResponse.redirect(`${origin}/dashboard`, 302)
  } catch (err) {
    console.error('[auth/callback] unexpected error:', err)
    return NextResponse.redirect(`${origin}/login?error=internal`, 302)
  }
}
