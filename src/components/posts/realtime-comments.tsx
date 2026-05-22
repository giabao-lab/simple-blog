'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Comment } from '@/types/database'
import { CommentList } from './comment-list'

interface RealtimeCommentsProps {
  postId: string
  initialComments: Comment[]
}

export function RealtimeComments({ postId, initialComments }: RealtimeCommentsProps) {
  const supabase = useMemo(() => createClient(), [])
  const [comments, setComments] = useState<Comment[]>(initialComments)

  useEffect(() => {
    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          const { data: newComment } = await supabase
            .from('comments')
            .select(
              `
*,
profiles (
display_name,
avatar_url
)
`
            )
            .eq('id', payload.new.id)
            .single()

          if (newComment) {
            setComments((prev) => [...prev, newComment])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId, supabase])

  return (
    <div className="space-y-4">
      <CommentList comments={comments} />
    </div>
  )
}
