import { Comment } from '@/types/database'

interface CommentListProps {
  comments: Comment[]
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-700/30 px-6 py-10 text-center text-slate-400">
        Chưa có bình luận nào. Hãy là người đầu tiên!
      </div>
    )
  }

  return <div className="space-y-4">{comments.map((comment) => (
    <div key={comment.id} className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-sm font-bold text-blue-400">
          {(comment.profiles?.display_name || 'A').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-slate-100">{comment.profiles?.display_name || 'Ẩn danh'}</span>
            <span className="text-xs text-slate-400">
              {new Date(comment.created_at).toLocaleDateString('vi-VN')}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{comment.content}</p>
        </div>
      </div>
    </div>
  ))}</div>
}
