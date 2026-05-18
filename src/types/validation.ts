import { z } from 'zod'

// Post Validation Schema
export const createPostSchema = z.object({
  title: z.string()
    .min(3, 'Tiêu đề phải có ít nhất 3 ký tự')
    .max(200, 'Tiêu đề không được vượt quá 200 ký tự'),
  slug: z.string()
    .min(3, 'Slug phải có ít nhất 3 ký tự')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ được chứa chữ cái, số và dấu gạch ngang'),
  excerpt: z.string()
    .max(500, 'Tóm tắt không được vượt quá 500 ký tự')
    .optional()
    .nullable(),
  content: z.string()
    .max(50000, 'Nội dung không được vượt quá 50000 ký tự')
    .optional()
    .nullable(),
  cover_image_url: z.string()
    .url('URL ảnh bìa không hợp lệ')
    .optional()
    .nullable(),
  status: z.enum(['draft', 'published']).default('draft'),
  categoryIds: z.array(z.string().uuid()).optional().default([]),
})

export const updatePostSchema = createPostSchema.partial()

export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>

// Comment Validation Schema
export const createCommentSchema = z.object({
  content: z.string()
    .min(1, 'Bình luận không được để trống')
    .max(5000, 'Bình luận không được vượt quá 5000 ký tự'),
  post_id: z.string().uuid('Post ID không hợp lệ'),
})

export const updateCommentSchema = z.object({
  content: z.string()
    .min(1, 'Bình luận không được để trống')
    .max(5000, 'Bình luận không được vượt quá 5000 ký tự'),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>

// Category Validation Schema
export const createCategorySchema = z.object({
  name: z.string()
    .min(2, 'Tên danh mục phải có ít nhất 2 ký tự')
    .max(50, 'Tên danh mục không được vượt quá 50 ký tự'),
  slug: z.string()
    .min(2, 'Slug phải có ít nhất 2 ký tự')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ được chứa chữ cái, số và dấu gạch ngang'),
  description: z.string()
    .max(500, 'Mô tả không được vượt quá 500 ký tự')
    .optional()
    .nullable(),
  color: z.string()
    .regex(/^(blue|purple|green|yellow|indigo|red|pink)$/, 'Màu sắc không hợp lệ')
    .default('blue'),
  icon: z.string().optional().nullable(),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>

// Profile Validation Schema
export const updateProfileSchema = z.object({
  display_name: z.string()
    .min(2, 'Tên hiển thị phải có ít nhất 2 ký tự')
    .max(100, 'Tên hiển thị không được vượt quá 100 ký tự')
    .optional()
    .nullable(),
  avatar_url: z.string()
    .url('URL avatar không hợp lệ')
    .optional()
    .nullable(),
  bio: z.string()
    .max(500, 'Tiểu sử không được vượt quá 500 ký tự')
    .optional()
    .nullable(),
  website: z.string()
    .url('URL website không hợp lệ')
    .optional()
    .nullable(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

// Auth Validation Schemas
export const signUpSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất một chữ cái in hoa')
    .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất một số'),
  display_name: z.string()
    .min(2, 'Tên hiển thị phải có ít nhất 2 ký tự')
    .optional(),
})

export const signInSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
