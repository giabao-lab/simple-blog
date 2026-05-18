-- Migration 001: Initial Schema for Blog System
-- Create Posts table with proper structure and indexes

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  slug text not null unique,
  content text,
  excerpt text,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Constraints
  constraint title_not_empty check (length(title) > 0),
  constraint slug_not_empty check (length(slug) > 0)
);

-- Add indexes for better query performance
create index idx_posts_author_id on public.posts (author_id);
create index idx_posts_status on public.posts (status);
create index idx_posts_slug on public.posts (slug);
create index idx_posts_published_at on public.posts (published_at desc) where status = 'published';

alter table public.posts enable row level security;

-- RLS Policies for Posts
create policy "Anyone can view published posts"
  on public.posts
  for select
  to public
  using (status = 'published' or auth.uid() = author_id);

create policy "Authenticated users can create posts"
  on public.posts
  for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "Authors can update their own posts"
  on public.posts
  for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Authors can delete their own posts"
  on public.posts
  for delete
  to authenticated
  using (auth.uid() = author_id);

-- Create trigger to update updated_at automatically
create or replace function public.update_posts_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_posts_timestamp_trigger
before update on public.posts
for each row
execute function public.update_posts_timestamp();
