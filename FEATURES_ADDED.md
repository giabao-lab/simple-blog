# Recent Features Added

## Homepage Post Search & Filtering

### Features Implemented:
1. **Search by Title/Excerpt** - Search posts by title or excerpt content
2. **Search by Author Name** - Find posts by author's display name (automatically looks up author ID)
3. **Sort Options**:
   - "Mới nhất" (Newest) - Orders by published_at descending
   - "Nổi bật nhất" (Most Liked) - Will order by like_count once migration is deployed

### UI Components:
- **Search Form**: 3 input fields in responsive layout
  - Text input for title/excerpt search
  - Text input for author name search
  - Dropdown select for sort order
- **Clear Filters Button**: Appears when any filter is active
- **Pagination**: Preserves all filter params (q, author_name, sort) in pagination links
- **Empty State**: Different message depending on whether filters are active

### Database Setup:
The following migration has been created but **NEEDS DEPLOYMENT**:

**File**: `supabase/migrations/20260522_add_login_history.sql`

**New Tables**:
- `post_likes` - Tracks user likes on posts
  - Fields: id, post_id (FK), user_id (FK), created_at
  - Constraint: unique(post_id, user_id) - ensures each user can only like a post once
  - Indexes: idx_post_likes_post_id, idx_post_likes_user_id

**New View**:
- `posts_with_likes` - Posts with aggregated like_count
  - Joins posts LEFT JOIN post_likes
  - Aggregates COUNT(pl.id) as like_count
  - Used for "Most Liked" sorting

### How to Deploy the Migration:
1. **Using Supabase CLI** (requires authentication):
   ```bash
   supabase login
   supabase link --project-ref hqfunalqcfupjmtjsgrr
   supabase db push
   ```

2. **Using Supabase Dashboard**:
   - Go to SQL Editor
   - Create a new SQL script
   - Copy the contents of `supabase/migrations/20260522_add_login_history.sql`
   - Execute the script

### Behavior After Migration:
Once the migration is deployed:
1. Users can like/unlike posts (UI to be added)
2. The "Nổi bật nhất" (Most Liked) sort option will work correctly
3. Posts will be sorted by like_count when selected

### Code References:
- **Homepage**: [app/page.tsx](app/page.tsx)
  - Author name lookup: Lines with `profiles` select/ilike
  - Sort handling: Comment about posts_with_likes view
  - Search form UI: New 3-column form layout
  - Pagination: URLSearchParams for smart param preservation

### Next Steps:
1. Deploy the migration to Supabase
2. Add UI for liking/unliking posts (like button on post cards)
3. Test "Most Liked" sorting once deployment is complete
