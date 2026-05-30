-- Dữ liệu mẫu (Sample Data) cho dự án LGBlog

-- (Lưu ý: Trong Supabase, author_id phải liên kết với một user có thật trong bảng auth.users. 
-- Để chạy được script này, bạn hãy thay thế chuỗi '00000000-0000-0000-0000-000000000000' 
-- bằng UUID thực tế của một user trong phần Authentication của bạn).

INSERT INTO public.posts (author_id, title, slug, content, excerpt, status, published_at, is_featured)
VALUES 
('00000000-0000-0000-0000-000000000000', 
 'Chào mừng đến với LGBlog - Nền tảng blog hiện đại', 
 'chao-mung-den-voi-lgblog', 
 'Nội dung chi tiết của bài viết đầu tiên trên hệ thống LGBlog. Đây là một nền tảng chia sẻ kiến thức công nghệ tuyệt vời được xây dựng bằng Next.js 14 và Supabase Postgres.', 
 'Khám phá kiến trúc và công nghệ đằng sau LGBlog.', 
 'published', 
 now(),
 true),

('00000000-0000-0000-0000-000000000000', 
 'Hướng dẫn sử dụng Supabase thay thế Firebase', 
 'huong-dan-su-dung-supabase', 
 'Supabase là một nền tảng BaaS mã nguồn mở, cung cấp PostgreSQL database, Authentication, Realtime subscriptions và Storage. Nó là một giải pháp thay thế hoàn hảo cho Firebase...', 
 'Tìm hiểu cách thiết lập Database và Auth với Supabase.', 
 'published', 
 now(),
 false),

('00000000-0000-0000-0000-000000000000', 
 'Bản nháp: Next.js App Router nâng cao', 
 'nextjs-app-router-nang-cao', 
 'Bài viết này đang trong quá trình biên soạn, sẽ hướng dẫn chi tiết về Server Components và Route Handlers...', 
 'Đang biên soạn nội dung về App Router.', 
 'draft', 
 null,
 false);
