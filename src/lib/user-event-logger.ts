export async function logUserEvent(
  userId: string,
  eventType: 'login' | 'logout' | 'sign_up' | 'password_reset',
  userAgent?: string,
  ipAddress?: string,
  metadata?: Record<string, any>
) {
  void userId
  void eventType
  void userAgent
  void ipAddress
  void metadata
}
