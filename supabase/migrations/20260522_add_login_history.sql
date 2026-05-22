-- Migration: Create user_login_history table to record login events
create table if not exists public.user_login_history (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  event_type text not null default 'login', -- e.g., login, logout, register
  user_agent text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Index for fast lookup by user
create index if not exists idx_user_login_history_user_id on public.user_login_history(user_id);

-- Table: Post likes to track which users liked which posts
create table if not exists public.post_likes (
  id bigserial primary key,
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

-- Index for fast lookup by post
create index if not exists idx_post_likes_post_id on public.post_likes(post_id);
create index if not exists idx_post_likes_user_id on public.post_likes(user_id);

-- View: Post with like count
create or replace view public.posts_with_likes as
select
  p.*,
  coalesce(count(pl.id), 0) as like_count
from public.posts p
left join public.post_likes pl on p.id = pl.post_id
group by p.id;
