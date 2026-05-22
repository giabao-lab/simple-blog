import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const samplePosts = [
  {
    title: 'Hướng dẫn sử dụng Supabase',
    slug: 'huong-dan-su-dung-supabase',
    excerpt: 'Tìm hiểu cách sử dụng Supabase - một nền tảng backend mạnh mẽ dựa trên PostgreSQL',
    content: `# Hướng dẫn sử dụng Supabase

Supabase là một nền tảng backend mở được xây dựng trên PostgreSQL. Nó cung cấp:

## Tính năng chính

- **Database**: PostgreSQL đầy đủ công năng
- **Authentication**: Xác thực người dùng tích hợp
- **Real-time**: Cập nhật dữ liệu theo thời gian thực
- **Storage**: Lưu trữ file và hình ảnh
- **Edge Functions**: Chạy code trên edge

## Bắt đầu nhanh

1. Tạo tài khoản trên [supabase.com](https://supabase.com)
2. Tạo một project mới
3. Lấy URL và API key
4. Kết nối với ứng dụng của bạn

## Ví dụ kết nối

\`\`\`javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)
\`\`\`

Supabase giúp bạn xây dựng ứng dụng nhanh chóng và an toàn!`,
    status: 'published',
    author_id: null,
  },
  {
    title: 'Next.js 16: Những tính năng mới',
    slug: 'nextjs-16-tinh-nang-moi',
    excerpt: 'Khám phá những tính năng mới và cải tiến trong Next.js phiên bản 16',
    content: `# Next.js 16: Những tính năng mới

Next.js 16 mang đến nhiều cải tiến đáng kể cho các nhà phát triển.

## Server Components

Server Components cho phép bạn render component trực tiếp trên máy chủ, giảm JavaScript gửi đến client.

## Streaming

Bạn có thể stream HTML từ máy chủ, giúp trang load nhanh hơn.

## Image Optimization

Hình ảnh được tối ưu hóa tự động, giúp cải thiện hiệu suất.

## API Routes

API Routes vẫn là cách dễ dàng để tạo API endpoints.

Nâng cấp lên Next.js 16 hôm nay!`,
    status: 'published',
    author_id: null,
  },
  {
    title: 'Tailwind CSS v4 - Styling hiện đại',
    slug: 'tailwind-css-v4-styling-hien-dai',
    excerpt: 'Tìm hiểu cách sử dụng Tailwind CSS v4 để tạo giao diện đẹp',
    content: `# Tailwind CSS v4 - Styling hiện đại

Tailwind CSS v4 mang đến một cách mới để viết CSS.

## Utility-First CSS

Thay vì viết CSS truyền thống, bạn sử dụng các class tiện ích.

\`\`\`html
<div class="flex items-center justify-center h-screen bg-blue-500">
  <p class="text-white text-2xl">Hello World</p>
</div>
\`\`\`

## Responsive Design

Tailwind giúp bạn dễ dàng tạo design responsive:

\`\`\`html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <!-- Các item -->
</div>
\`\`\`

## Dark Mode

Hỗ trợ dark mode tích hợp sẵn.

Tailwind CSS giúp bạn viết CSS nhanh hơn!`,
    status: 'published',
    author_id: null,
  },
  {
    title: 'TypeScript - Type Safety cho JavaScript',
    slug: 'typescript-type-safety-cho-javascript',
    excerpt: 'Tại sao bạn nên sử dụng TypeScript trong dự án của mình',
    content: `# TypeScript - Type Safety cho JavaScript

TypeScript thêm type system vào JavaScript, giúp bạn viết code an toàn hơn.

## Lợi ích của TypeScript

- **Type Safety**: Phát hiện lỗi sớm
- **IntelliSense**: Autocompletion tốt hơn
- **Refactoring**: Dễ dàng thay đổi code
- **Documentation**: Type chính là documentation

## Ví dụ

\`\`\`typescript
interface User {
  id: number
  name: string
  email: string
}

function getUser(id: number): User {
  // Lấy user từ database
  return { id, name: 'John', email: 'john@example.com' }
}
\`\`\`

TypeScript giúp bạn viết code chất lượng cao hơn!`,
    status: 'published',
    author_id: null,
  },
]

async function seed() {
  try {
    console.log('🌱 Bắt đầu seeding dữ liệu...')

    // Get all users to assign as author
    const { data: users } = await supabase.auth.admin.listUsers()
    const firstUserId = users?.users?.[0]?.id

    // Insert sample posts
    for (const post of samplePosts) {
      const { data, error } = await supabase.from('posts').insert([
        {
          ...post,
          author_id: firstUserId || null,
        },
      ])

      if (error) {
        console.error(`❌ Lỗi khi tạo bài viết "${post.title}":`, error.message)
      } else {
        console.log(`✅ Tạo bài viết "${post.title}" thành công`)
      }
    }

    console.log('✨ Seeding hoàn tất!')
  } catch (error) {
    console.error('❌ Lỗi:', error)
    process.exit(1)
  }
}

seed()
