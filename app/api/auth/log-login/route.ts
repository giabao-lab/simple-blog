import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const event = body?.event || 'login'
  const metadata = body?.metadata || null

  const userAgent = request.headers.get('user-agent') || null

  const { error } = await supabase.from('user_login_history').insert({
    user_id: user.id,
    event_type: event,
    user_agent: userAgent,
    metadata,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
