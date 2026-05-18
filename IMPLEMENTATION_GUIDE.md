# 🚀 IMPLEMENTATION GUIDE - Next Steps

## Phase 1: Immediate Actions (Do This First)

### Step 1: Install New Dependencies
```bash
npm install @hookform/resolvers react-hook-form zod \
  @radix-ui/react-dialog @radix-ui/react-alert-dialog @radix-ui/react-slot \
  class-variance-authority clsx tailwind-merge
```

### Step 2: Run Database Migrations
```bash
# Via Supabase CLI
supabase migration up

# Or manually:
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Copy-paste each migration file and execute:
#    - supabase/migrations/20260518_001_initial_schema.sql
#    - supabase/migrations/20260518_002_categories.sql
#    - supabase/migrations/20260518_003_comments.sql
```

### Step 3: Setup Supabase Codegen (Optional but Recommended)
```bash
npm install -D @supabase/supabase-js supabase

# Generate TypeScript types from your Supabase schema
supabase gen types typescript > src/types/supabase.ts
```

---

## Phase 2: Create Server Actions for Core Features

### 2.1 Create Post Server Actions
**File**: `app/dashboard/actions.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { createPostSchema, updatePostSchema } from '@/types/validation'
import { redirect } from 'next/navigation'

export async function createPost(data: unknown) {
  try {
    const validated = createPostSchema.parse(data)
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        author_id: user.id,
        ...validated,
      })
      .select('id, slug')
      .single()

    if (error) throw error

    // Associate categories if provided
    if (validated.categoryIds.length > 0) {
      const { error: categoryError } = await supabase
        .from('post_categories')
        .insert(
          validated.categoryIds.map(catId => ({
            post_id: post.id,
            category_id: catId,
          }))
        )
      
      if (categoryError) throw categoryError
    }

    return { success: true, postId: post.id, slug: post.slug }
  } catch (error) {
    console.error('Error creating post:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create post' 
    }
  }
}

export async function updatePost(postId: string, data: unknown) {
  try {
    const validated = updatePostSchema.parse(data)
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify ownership
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single()

    if (fetchError || post.author_id !== user.id) {
      throw new Error('Unauthorized')
    }

    const { error } = await supabase
      .from('posts')
      .update(validated)
      .eq('id', postId)

    if (error) throw error

    // Update categories if provided
    if (validated.categoryIds !== undefined) {
      // Delete old associations
      await supabase
        .from('post_categories')
        .delete()
        .eq('post_id', postId)

      // Add new associations
      if (validated.categoryIds.length > 0) {
        const { error: categoryError } = await supabase
          .from('post_categories')
          .insert(
            validated.categoryIds.map(catId => ({
              post_id: postId,
              category_id: catId,
            }))
          )
        
        if (categoryError) throw categoryError
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating post:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update post' 
    }
  }
}

export async function deletePost(postId: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify ownership
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single()

    if (fetchError || post.author_id !== user.id) {
      throw new Error('Unauthorized')
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error deleting post:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete post' 
    }
  }
}
```

### 2.2 Create Comment Server Actions
**File**: `src/app/actions/comments.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { createCommentSchema, updateCommentSchema } from '@/types/validation'
import { PaginatedResponse, Comment } from '@/types/database'

export async function createComment(data: unknown) {
  try {
    const validated = createCommentSchema.parse(data)
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Must be logged in to comment')
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        post_id: validated.post_id,
        author_id: user.id,
        content: validated.content,
      })
      .select('*, profiles(display_name, avatar_url)')
      .single()

    if (error) throw error

    return { success: true, comment }
  } catch (error) {
    console.error('Error creating comment:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create comment' 
    }
  }
}

export async function getComments(
  postId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Comment>> {
  try {
    const supabase = await createClient()

    // Get total count
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data: comments, error } = await supabase
      .from('comments')
      .select('*, profiles(display_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      data: comments || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    }
  } catch (error) {
    console.error('Error fetching comments:', error)
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    }
  }
}

export async function updateComment(commentId: string, data: unknown) {
  try {
    const validated = updateCommentSchema.parse(data)
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify ownership
    const { data: comment } = await supabase
      .from('comments')
      .select('author_id')
      .eq('id', commentId)
      .single()

    if (comment.author_id !== user.id) {
      throw new Error('Unauthorized')
    }

    const { error } = await supabase
      .from('comments')
      .update({ content: validated.content })
      .eq('id', commentId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error updating comment:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update comment' 
    }
  }
}

export async function deleteComment(commentId: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify ownership
    const { data: comment } = await supabase
      .from('comments')
      .select('author_id')
      .eq('id', commentId)
      .single()

    if (comment.author_id !== user.id) {
      throw new Error('Unauthorized')
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error deleting comment:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete comment' 
    }
  }
}
```

### 2.3 Create Category Server Actions
**File**: `src/app/actions/categories.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { Category } from '@/types/database'

export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export async function getPostsByCategory(
  slug: string,
  page: number = 1,
  pageSize: number = 10
) {
  try {
    const supabase = await createClient()

    // Get category
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single()

    if (categoryError || !category) throw new Error('Category not found')

    // Get post count
    const { count } = await supabase
      .from('post_categories')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', category.id)

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Get posts
    const { data: postCategories, error: postsError } = await supabase
      .from('post_categories')
      .select('post_id')
      .eq('category_id', category.id)
      .range(from, to)

    if (postsError) throw postsError

    const postIds = (postCategories || []).map(pc => pc.post_id)

    if (postIds.length === 0) {
      return {
        category,
        posts: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      }
    }

    const { data: posts } = await supabase
      .from('posts')
      .select('*, profiles(display_name, avatar_url)')
      .in('id', postIds)
      .eq('status', 'published')

    return {
      category,
      posts: posts || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    }
  } catch (error) {
    console.error('Error fetching posts by category:', error)
    return {
      category: null,
      posts: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    }
  }
}
```

---

## Phase 3: Create UI Components

### 3.1 Comment System Component
**File**: `src/components/posts/comments-section.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Comment } from '@/types/database'
import { getComments, createComment, deleteComment } from '@/app/actions/comments'

interface CommentsSectionProps {
  postId: string
  isAuthenticated: boolean
}

export function CommentsSection({ postId, isAuthenticated }: CommentsSectionProps) {
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadComments()
  }, [postId])

  async function loadComments() {
    const result = await getComments(postId)
    setComments(result.data)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)
    const result = await createComment({
      post_id: postId,
      content: newComment,
    })

    if (result.success) {
      setNewComment('')
      await loadComments()
      router.refresh()
    }
    setSubmitting(false)
  }

  async function handleDelete(commentId: string) {
    const result = await deleteComment(commentId)
    if (result.success) {
      await loadComments()
      router.refresh()
    }
  }

  return (
    <section className="mt-12 border-t pt-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Bình luận</h3>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Viết bình luận của bạn..."
            className="w-full rounded-lg border border-gray-300 p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
          </button>
        </form>
      ) : (
        <p className="text-gray-600 mb-6">
          <a href="/login" className="text-blue-600 hover:underline">Đăng nhập</a> để bình luận
        </p>
      )}

      <div className="space-y-4">
        {loading ? (
          <p className="text-gray-500">Đang tải bình luận...</p>
        ) : comments.length === 0 ? (
          <p className="text-gray-500">Chưa có bình luận nào</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">
                  {comment.profiles?.display_name || 'Ẩn danh'}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(comment.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <p className="text-gray-700">{comment.content}</p>
              <button
                onClick={() => handleDelete(comment.id)}
                className="mt-2 text-sm text-red-600 hover:text-red-700"
              >
                Xóa
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
```

### 3.2 Category Selector Component
**File**: `src/components/posts/category-selector.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Category } from '@/types/database'
import { getCategories } from '@/app/actions/categories'

interface CategorySelectorProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function CategorySelector({ selectedIds, onChange }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCategories() {
      const cats = await getCategories()
      setCategories(cats)
      setLoading(false)
    }
    loadCategories()
  }, [])

  function toggleCategory(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter(cid => cid !== id)
        : [...selectedIds, id]
    )
  }

  if (loading) return <p className="text-gray-500">Đang tải danh mục...</p>

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900">Danh mục</label>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => toggleCategory(cat.id)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedIds.includes(cat.id)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  )
}
```

---

## Phase 4: Update Post Detail Page

**File**: `app/posts/[slug]/page.tsx`

```typescript
import { CommentsSection } from '@/components/posts/comments-section'
import { createClient } from '@/lib/supabase/server'

export default async function PostDetail({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const supabase = await createClient()
  const { slug } = await params

  const { data: post, error } = await supabase
    .from('posts')
    .select('*, profiles(display_name, avatar_url), post_categories(categories(id, name, slug, color))')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !post) {
    return <div className="text-center py-12">Bài viết không tìm thấy</div>
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen bg-white py-12">
      <article className="mx-auto max-w-3xl px-4">
        {/* Post Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
          
          {/* Categories */}
          {post.post_categories && post.post_categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.post_categories.map((pc: any) => (
                <span
                  key={pc.categories.id}
                  className={`px-3 py-1 rounded-full text-sm font-medium bg-${pc.categories.color}-100 text-${pc.categories.color}-800`}
                >
                  {pc.categories.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>By {post.profiles?.display_name || 'Anonymous'}</span>
            <span>•</span>
            <span>{new Date(post.published_at).toLocaleDateString('vi-VN')}</span>
          </div>
        </header>

        {/* Post Content */}
        <div className="prose prose-lg max-w-none mb-12">
          {post.content}
        </div>

        {/* Comments Section */}
        <CommentsSection postId={post.id} isAuthenticated={!!user} />
      </article>
    </main>
  )
}
```

---

## Phase 5: Testing Checklist

- [ ] Run migrations successfully
- [ ] Install dependencies: `npm install`
- [ ] Test creating a post with categories
- [ ] Test creating a comment on a published post
- [ ] Test comment deletion (own only)
- [ ] Verify RLS policies work:
  - [ ] Anonymous can read published posts + comments
  - [ ] Draft posts hidden from non-authors
  - [ ] Can't create comments on draft posts
  - [ ] Users can only delete own comments
- [ ] Test category filtering

---

## Phase 6: Deployment

```bash
# Build
npm run build

# Test production build
npm run start

# Deploy to Vercel
vercel deploy
```

---

**Next**: Create these components and run migrations in order!
