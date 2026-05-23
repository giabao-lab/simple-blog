import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logUserEvent } from '@/lib/user-event-logger'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const metadata = body?.metadata || null
  try {
    await logUserEvent(
      user.id,
      'login',
      request.headers.get('user-agent') || undefined,
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() || undefined,
      { method: 'email', ...metadata }
    )
  } catch (error) {
    console.error('Error logging login:', error)
    return NextResponse.json({ error: 'Failed to log login' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
