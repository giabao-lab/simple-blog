# Hướng Dẫn Deploy Migrations lên Supabase

## 🚨 BẮT BUỘC: Deploy migrations để hệ thống thông báo hoạt động

Hệ thống thông báo sẽ **KHÔNG HOẠT ĐỘNG** nếu không deploy migrations lên Supabase database.

## Các Migration cần Deploy

```
1. 20260510_post_images_storage.sql    (Featured images)
2. 20260510_profile_likes.sql          (Likes table)
3. 20260518_001_initial_schema.sql     (Core tables: posts, profiles)
4. 20260518_002_categories.sql         (Categories)
5. 20260518_003_comments.sql           (Comments)
6. 20260518_add_roles_and_rls.sql      (RLS policies)
7. 20260522_add_featured_image.sql     (Featured image columns)
8. 20260522_add_login_history.sql      (Login tracking)
9. 20260522_add_notifications.sql      (✨ NOTIFICATIONS - CỰC KỲ QUAN TRỌNG)
```

## Cách Deploy

### Option 1: Dùng Supabase CLI (Khuyến nghị)
```bash
# Đảm bảo đã cài Supabase CLI
# https://supabase.com/docs/guides/cli/getting-started

# Login vào Supabase
supabase login

# Link project
supabase link --project-ref your_project_ref

# Deploy migrations
supabase db push
```

### Option 2: Dùng SQL Editor trong Supabase Dashboard
1. Truy cập https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **SQL Editor**
4. Click **New query**
5. Copy nội dung từ file `supabase/migrations/20260522_add_notifications.sql`
6. Chạy query
7. Lặp lại cho các migrations khác nếu chưa có

## Kiểm Tra Kết Quả

Sau khi deploy:

1. **Kiểm tra bảng notifications đã tạo:**
   - SQL Editor → Query: `SELECT * FROM notifications LIMIT 1;`
   - Nếu không lỗi, migrations đã deploy thành công

2. **Kiểm tra triggers:**
   - SQL Editor → Query: `SELECT trigger_name FROM information_schema.triggers WHERE trigger_name LIKE '%notification%';`
   - Nên thấy: `trigger_like_notification`, `trigger_comment_notification`

3. **Test thực tế:**
   - Login vào blog
   - Tạo bài viết
   - Tạo user khác hoặc ask friend
   - User khác like hoặc comment bài viết
   - Kiểm tra chuông thông báo (🔔) - phải hiển thị thông báo mới

## Troubleshooting

### "Table notifications already exists"
- Đã deploy rồi, bỏ qua warning này

### "No records in notifications"
- Kiểm tra:
  1. Migration đã deploy chưa? (Xem SQL Editor)
  2. Có triggers không? (Query ở trên)
  3. Tạo like/comment mới?
  4. Kiểm tra logs: `SELECT * FROM likes;` (có dữ liệu không?)

### "Notification không hiện"
- Kiểm tra:
  1. Đã login chưa?
  2. Có người khác like/comment không?
  3. Kiểm tra notification bell (🔔) ở header
  4. Kiểm tra browser console cho lỗi

### RLS Policy Error
- Nếu thấy lỗi "permission denied"
- Quay lại SQL Editor chạy:
```sql
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

## Lưu Ý Quan Trọng

⚠️ **Nếu deploy migration này bị lỗi:**
1. Kiểm tra bảng `posts`, `likes`, `comments` đã tồn tại chưa
2. Kiểm tra bảng `auth.users` - Supabase sẽ auto create

✅ **Sau khi deploy thành công:**
- Thông báo sẽ tự động tạo khi có like/comment (via triggers)
- Real-time updates sẽ hoạt động ngay lập tức
- Người dùng sẽ thấy chuông 🔔 có số thông báo chưa đọc
