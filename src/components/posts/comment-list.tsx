import { Comment } from '@/types/database'

interface CommentListProps {
  comments: Comment[]
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-gray-500">
        Chưa có bình luận nào. Hãy là người đầu tiên!
      </div>
    )
  }

  return <div className="space-y-4">{comments.map((comment) => (
    <div key={comment.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
          {(comment.profiles?.display_name || 'A').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-gray-900">{comment.profiles?.display_name || 'Ẩn danh'}</span>
            <span className="text-xs text-gray-400">
              {new Date(comment.created_at).toLocaleDateString('vi-VN')}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{comment.content}</p>
        </div>
      </div>
    </div>
  ))}</div>
}
