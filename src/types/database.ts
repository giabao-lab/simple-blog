export type PostStatus = 'draft' | 'published'

// User Profile
export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  bio?: string | null
  website?: string | null
}

// Blog Post
export interface Post {
  id: string
  author_id: string
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  cover_image_url: string | null
  status: PostStatus
  created_at: string
  updated_at: string
  published_at: string | null
  // Joined data
  profiles?: Profile
  categories?: Category[]
}

// Category
export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  icon: string | null
  created_at: string
  updated_at: string
}

// Post-Category Association
export interface PostCategory {
  post_id: string
  category_id: string
  created_at: string
}

// Comment
export interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string
  // Joined data
  profiles?: Profile
}

// Like
export interface Like {
  post_id: string
  user_id: string
  created_at: string
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Error Type
export class AppError extends Error {
  constructor(
    public statusCode: number = 500,
    public message: string = 'Internal Server Error'
  ) {
    super(message)
    this.name = 'AppError'
  }
}
