import { Comment } from '@/types/database'

interface CommentListProps {
  comments: Comment[]
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
          style={{ background: 'rgba(99,102,241,0.08)' }}>
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ color: '#4f5a8a' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: '#475569' }}>Chưa có bình luận nào</p>
        <p className="text-xs mt-1" style={{ color: '#334155' }}>Hãy là người đầu tiên bình luận!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div key={comment.id}
          className="flex items-start gap-4 p-5 rounded-2xl transition-all duration-200 hover:border-white/10"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-black"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
            {(comment.profiles?.display_name || 'A').charAt(0).toUpperCase()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
              <span className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>
                {comment.profiles?.display_name || 'Ẩn danh'}
              </span>
              <span className="text-xs" style={{ color: '#475569' }}>
                {new Date(comment.created_at).toLocaleDateString('vi-VN', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </span>
            </div>
            <p className="text-sm leading-7 whitespace-pre-wrap" style={{ color: '#94a3b8' }}>
              {comment.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
