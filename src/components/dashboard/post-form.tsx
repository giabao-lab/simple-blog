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
  const [featuredImageUrl, setFeaturedImageUrl] = useState(post?.featured_image_url || '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingFeaturedImage, setUploadingFeaturedImage] = useState(false)

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

  const handleFeaturedImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    setUploadingFeaturedImage(true)

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
      setFeaturedImageUrl(data.publicUrl)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload ảnh thất bại'
      setError(errorMessage)
    } finally {
      setUploadingFeaturedImage(false)
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
        featured_image_url: featuredImageUrl || null,
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
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-800 shadow-xl shadow-slate-900/60"
    >
      <div className="border-b border-slate-700 bg-linear-to-r from-slate-800 to-slate-700 px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
            {isEditing ? 'Chỉnh sửa' : 'Soạn thảo'}
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">
            {isEditing ? 'Cập nhật nội dung bài viết' : 'Tạo bài viết mới'}
          </h2>
          <p className="text-sm text-slate-300">
            Viết nội dung rõ ràng, hỗ trợ Markdown và upload ảnh trực tiếp vào bài.
          </p>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6 sm:px-8">
        {error ? (
          <div className="rounded-2xl border border-red-700 bg-red-900/20 px-4 py-3 text-sm text-red-300">{error}</div>
        ) : null}

        <div className="grid gap-6">
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-semibold text-slate-100">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="block w-full rounded-2xl border border-slate-700 bg-slate-700/30 px-4 py-3 text-slate-100 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-900/20 placeholder:text-slate-500"
              placeholder="Nhập tiêu đề bài viết"
            />
          </div>

          <div>
            <label htmlFor="excerpt" className="mb-2 block text-sm font-semibold text-slate-100">
              Tóm tắt
            </label>
            <input
              id="excerpt"
              type="text"
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              className="block w-full rounded-2xl border border-slate-700 bg-slate-700/30 px-4 py-3 text-slate-100 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-900/20 placeholder:text-slate-500"
              placeholder="Mô tả ngắn hiển thị trên danh sách bài viết"
            />
          </div>

          <div>
            <label htmlFor="featured-image" className="mb-2 block text-sm font-semibold text-slate-100">
              Ảnh bìa
            </label>
            <div className="flex flex-col gap-3">
              {featuredImageUrl && (
                <div className="relative overflow-hidden rounded-2xl border border-slate-700">
                  <img src={featuredImageUrl} alt="Featured" className="h-48 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFeaturedImageUrl('')}
                    className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <input
                id="featured-image"
                type="file"
                accept="image/*"
                onChange={handleFeaturedImageUpload}
                disabled={uploadingFeaturedImage}
                className="block w-full rounded-2xl border border-slate-700 bg-slate-700/30 px-4 py-3 text-sm text-slate-100 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white file:font-semibold hover:file:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-slate-400">Ảnh bìa sẽ hiển thị trên hero section và danh sách bài viết</p>
            </div>
          </div>

          <div>
            <label htmlFor="content" className="mb-2 block text-sm font-semibold text-slate-100">
              Nội dung
            </label>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage}
                className="inline-flex items-center rounded-2xl border border-slate-700 bg-slate-700/30 px-4 py-2 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-600 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadingImage ? 'Đang upload...' : 'Upload ảnh'}
              </button>
              <span className="text-sm text-slate-400">Ảnh sẽ được chèn vào nội dung dưới dạng Markdown</span>
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
              rows={16}
              className="block w-full rounded-2xl border border-slate-700 bg-slate-700/30 px-4 py-3 font-mono text-slate-100 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-900/20"
              placeholder="Viết nội dung bài viết của bạn..."
            />
            <p className="mt-2 text-xs text-slate-400">Hỗ trợ Markdown</p>
          </div>

          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-semibold text-slate-100">
              Trạng thái
            </label>
            <select
              id="status"
              value={status}
              onChange={(event) => setStatus(event.target.value as PostStatus)}
              className="block w-full rounded-2xl border border-slate-700 bg-slate-700/30 px-4 py-3 text-slate-100 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-900/20"
            >
              <option value="draft">Bản nháp</option>
              <option value="published">Xuất bản</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-700/30 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo bài viết'}
          </button>
        </div>
      </div>
    </form>
  )
}
