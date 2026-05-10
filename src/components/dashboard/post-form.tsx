'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Post, PostStatus } from '@/types/database'

interface PostFormProps {
  post?: Post
}

export function PostForm({ post }: PostFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const contentRef = useRef<HTMLTextAreaElement | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  const isEditing = !!post
  const [title, setTitle] = useState(post?.title || '')
  const [content, setContent] = useState(post?.content || '')
  const [excerpt, setExcerpt] = useState(post?.excerpt || '')
  const [status, setStatus] = useState<PostStatus>(post?.status || 'draft')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const insertAtCursor = (textToInsert: string) => {
    const textarea = contentRef.current

    if (!textarea) {
      setContent((current) => `${current}${current ? '\n\n' : ''}${textToInsert}`)
      return
    }

    const start = textarea.selectionStart ?? content.length
    const end = textarea.selectionEnd ?? content.length
    const currentContent = content
    const nextContent = `${currentContent.slice(0, start)}${textToInsert}${currentContent.slice(end)}`
    setContent(nextContent)

    requestAnimationFrame(() => {
      textarea.focus()
      const nextCursor = start + textToInsert.length
      textarea.setSelectionRange(nextCursor, nextCursor)
    })
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh hợp lệ')
      event.target.value = ''
      return
    }

    setError(null)
    setUploadingImage(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Bạn cần đăng nhập để upload ảnh')
        return
      }

      const fileExtension = file.name.split('.').pop() || 'png'
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExtension}`

      const { error: uploadError } = await supabase.storage.from('post-images').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('post-images').getPublicUrl(filePath)
      const imageMarkdown = `![${title || 'Hình ảnh'}](${data.publicUrl})`
      insertAtCursor(imageMarkdown)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload ảnh thất bại'
      setError(errorMessage)
    } finally {
      setUploadingImage(false)
      event.target.value = ''
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Bạn cần đăng nhập để thực hiện thao tác này')
        return
      }

      // Generate slug from title (simple version without special chars)
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '') || 'untitled'

      const postData = {
        title,
        slug,
        content,
        excerpt,
        status,
        author_id: user.id,
        published_at: status === 'published' ? new Date().toISOString() : null,
      }

      if (isEditing) {
        // Update existing post
        const { error: updateError } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', post.id)

        if (updateError) throw updateError
      } else {
        // Create new post
        const { error: insertError } = await supabase.from('posts').insert(postData)

        if (insertError) throw insertError
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra. Vui lòng thử lại.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      {error ? (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">{error}</div>
      ) : null}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-900">
          Tiêu đề <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="Nhập tiêu đề bài viết"
        />
      </div>

      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium text-gray-900">
          Tóm tắt
        </label>
        <input
          id="excerpt"
          type="text"
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="Mô tả ngắn về bài viết (hiển thị trong danh sách)"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-900">
          Nội dung
        </label>
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploadingImage}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploadingImage ? 'Đang upload...' : 'Upload ảnh'}
          </button>
          <span className="text-xs text-gray-600">Ảnh sẽ được chèn vào nội dung dưới dạng Markdown</span>
        </div>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <textarea
          id="content"
          value={content}
          ref={contentRef}
          onChange={(event) => setContent(event.target.value)}
          rows={15}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="Viết nội dung bài viết của bạn..."
        />
        <p className="mt-1 text-xs text-gray-600">Hỗ trợ Markdown</p>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-900">
          Trạng thái
        </label>
        <select
          id="status"
          value={status}
          onChange={(event) => setStatus(event.target.value as PostStatus)}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="draft">Bản nháp</option>
          <option value="published">Xuất bản</option>
        </select>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-900 hover:text-gray-600"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo bài viết'}
        </button>
      </div>
    </form>
  )
}
