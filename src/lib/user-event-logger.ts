import { createClient } from '@/lib/supabase/server'

export async function logUserEvent(
  userId: string,
  eventType: 'login' | 'logout' | 'sign_up' | 'password_reset',
  userAgent?: string,
  ipAddress?: string,
  metadata?: Record<string, any>
) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.rpc('log_user_event', {
      p_user_id: userId,
      p_event_type: eventType,
      p_user_agent: userAgent || null,
      p_ip_address: ipAddress || null,
      p_metadata: metadata || {},
    })

    if (error) {
      console.error('Failed to log user event:', error)
    }
  } catch (err) {
    console.error('Error logging user event:', err)
  }
}
