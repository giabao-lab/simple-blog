-- Migration 003: Comments System
-- Create comments table with full RLS policies

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  constraint content_not_empty check (length(content) > 0),
  constraint content_max_length check (length(content) <= 5000)
);

-- Add indexes for better query performance
create index idx_comments_post_id on public.comments (post_id);
create index idx_comments_author_id on public.comments (author_id);
create index idx_comments_created_at on public.comments (created_at desc);
create index idx_comments_post_created on public.comments (post_id, created_at desc);

alter table public.comments enable row level security;

-- RLS Policies for Comments
-- Anyone can read comments on published posts
create policy "Anyone can view comments on published posts"
  on public.comments
  for select
  to public
  using (
    exists (
      select 1 from public.posts
      where posts.id = post_id
      and posts.status = 'published'
    )
  );

-- Authors can view comments on their own posts (including drafts)
create policy "Post authors can view all comments on their posts"
  on public.comments
  for select
  to authenticated
  using (
    exists (
      select 1 from public.posts
      where posts.id = post_id
      and posts.author_id = auth.uid()
    )
  );

-- Authenticated users can create comments on published posts
create policy "Authenticated users can create comments"
  on public.comments
  for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.posts
      where posts.id = post_id
      and posts.status = 'published'
    )
  );

-- Users can update their own comments
create policy "Users can update their own comments"
  on public.comments
  for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- Users can delete their own comments
create policy "Users can delete their own comments"
  on public.comments
  for delete
  to authenticated
  using (auth.uid() = author_id);

-- Create trigger to update updated_at automatically
create or replace function public.update_comments_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_comments_timestamp_trigger
before update on public.comments
for each row
execute function public.update_comments_timestamp();
