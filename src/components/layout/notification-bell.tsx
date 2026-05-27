'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    fetchNotifications()

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [supabase])

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setNotifications([])
        return
      }

      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        // Using explicit join for posts to get slug. trigger_user join might not work if no direct FK to profiles.
        .select('*, post:posts(slug)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (notificationsError) {
        if (notificationsError.code !== '42P01') {
          console.error('Lỗi fetch notifications:', notificationsError)
        }
        setNotifications([])
        return
      }

      setNotifications((notificationsData || []).map((notification: any) => ({
        ...notification,
        trigger_user: notification.trigger_user || null,
        post: notification.post || null,
      })))
    } catch (error) {
      console.error('Lỗi khi lấy thông báo:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)

      if (error) {
        console.error('Lỗi khi đánh dấu đã đọc:', error)
        return
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      )
    } catch (error) {
      console.error('Lỗi khi đánh dấu thông báo:', error)
    }
  }

  const markAllAsRead = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        console.error('Lỗi khi đánh dấu tất cả:', error)
        return
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (error) {
      console.error('Lỗi khi cập nhật thông báo:', error)
    } finally {
      setLoading(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-slate-100">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
              >
                Đánh dấu tất cả
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400">Không có thông báo nào</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-slate-700 last:border-b-0 cursor-pointer transition ${
                    notification.is_read ? 'bg-slate-800' : 'bg-slate-800/60 hover:bg-slate-800'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <Link href={notification.post?.slug ? `/posts/${notification.post.slug}` : '#'} className="block">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {notification.type === 'like' ? (
                          <span className="text-lg">❤️</span>
                        ) : (
                          <span className="text-lg">💬</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-100">
                          <span className="font-semibold">
                            {notification.trigger_user?.display_name || 'Người dùng'}
                          </span>{' '}
                          {notification.type === 'like' ? 'đã thích' : 'đã bình luận'} bài viết của bạn
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(notification.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1"></div>
                      )}
                    </div>
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
