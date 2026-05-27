'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Notification {
  id: string
  type: 'like' | 'comment'
  post_id: string
  trigger_user_id: string
  is_read: boolean
  created_at: string
  trigger_user?: {
    display_name: string | null
  }
  post?: {
    slug: string
  }
}

export function NotificationBell() {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [supabase])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setNotifications([]); return }

      const { data, error } = await supabase
        .from('notifications')
        .select('*, post:posts(slug)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15)

      if (error) {
        if (error.code !== '42P01') console.error('Lỗi fetch notifications:', error)
        setNotifications([])
        return
      }

      setNotifications((data || []).map((n: any) => ({
        ...n,
        trigger_user: n.trigger_user || null,
        post: n.post || null,
      })))
    } catch (error) {
      console.error('Lỗi khi lấy thông báo:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
      setNotifications((prev) => prev.map((n) => n.id === notificationId ? { ...n, is_read: true } : n))
    } catch (error) {
      console.error('Lỗi đánh dấu đã đọc:', error)
    }
  }

  const markAllAsRead = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả:', error)
    } finally {
      setLoading(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return 'Vừa xong'
    if (mins < 60) return `${mins} phút trước`
    if (hours < 24) return `${hours} giờ trước`
    return `${days} ngày trước`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-white/5"
        style={{ color: '#94a3b8' }}
        aria-label="Thông báo"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white leading-none px-1"
            style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(10,15,30,0.95)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm" style={{ color: '#f1f5f9' }}>Thông báo</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-xs font-medium transition-colors hover:opacity-80 disabled:opacity-50"
                style={{ color: '#6366f1' }}
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.1)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    style={{ color: '#6366f1' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-sm" style={{ color: '#64748b' }}>Chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="relative transition-all duration-200"
                  style={{
                    background: notification.is_read ? 'transparent' : 'rgba(99,102,241,0.04)',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <Link
                    href={notification.post?.slug ? `/posts/${notification.post.slug}` : '#'}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-white/3 transition-colors"
                    onClick={() => markAsRead(notification.id)}
                  >
                    {/* Icon */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background: notification.type === 'like'
                          ? 'rgba(236,72,153,0.15)'
                          : 'rgba(99,102,241,0.15)',
                      }}
                    >
                      {notification.type === 'like' ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"
                          style={{ color: '#ec4899' }}>
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          style={{ color: '#6366f1' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug" style={{ color: '#cbd5e1' }}>
                        <span className="font-semibold" style={{ color: '#f1f5f9' }}>
                          {notification.trigger_user?.display_name || 'Người dùng'}
                        </span>
                        {' '}
                        {notification.type === 'like' ? 'đã thích' : 'đã bình luận'} bài viết của bạn
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#475569' }}>
                        {formatTime(notification.created_at)}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                        style={{ background: '#6366f1' }} />
                    )}
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
