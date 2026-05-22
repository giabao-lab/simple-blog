-- Migration: Add profiles table with role, trigger on auth.users,
-- helper functions and RLS policies for posts, profiles, comments
-- Run this in Supabase SQL editor or via psql.

-- 1) Create profiles table (or alter if exists)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Add missing columns if they don't exist
alter table if exists public.profiles
  add column if not exists role text not null default 'user';

alter table if exists public.profiles
  add column if not exists is_banned boolean not null default false;

-- 2) IMPORTANT: avoid auth trigger during signup.
-- Create profile from the app after the user has a session.
do $$
declare
  trigger_record record;
begin
  for trigger_record in
    select tgname
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth'
      and c.relname = 'users'
      and not t.tgisinternal
  loop
    execute format('drop trigger if exists %I on auth.users', trigger_record.tgname);
  end loop;
end $$;

drop function if exists public.handle_auth_user_created();
drop function if exists public.handle_profile_insert_from_app();

create or replace function public.handle_profile_insert_from_app()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is null then
    new.role := 'user';
  end if;

  if new.created_at is null then
    new.created_at := now();
  end if;

  return new;
end;
$$;

-- 3) Helper function to check admin role
create or replace function public.is_admin(uid uuid) returns boolean language sql security definer as $$
  select exists(select 1 from public.profiles p where p.id = uid and p.role = 'admin');
$$;

-- 4) Enable RLS and policies

-- POSTS table policies
alter table if exists public.posts enable row level security;

-- Drop old policies if they exist
drop policy if exists posts_select_published_or_owner on public.posts;
drop policy if exists posts_insert_authenticated on public.posts;
drop policy if exists posts_update_admin_or_owner on public.posts;
drop policy if exists posts_delete_admin_or_owner on public.posts;

-- Allow select for published posts or when requester is admin or owner
create policy posts_select_published_or_owner on public.posts
  for select using (
    status = 'published'
    or public.is_admin(auth.uid())
    or author_id = auth.uid()
  );

-- Allow insert for authenticated users (they become author)
create policy posts_insert_authenticated on public.posts
  for insert with check (
    (auth.uid() is not null and author_id = auth.uid() and (
      select coalesce(is_banned, false) from public.profiles where id = auth.uid()
    ) = false) or public.is_admin(auth.uid())
  );

-- Allow update: admin or owner
create policy posts_update_admin_or_owner on public.posts
  for update using (
    public.is_admin(auth.uid()) or author_id = auth.uid()
  ) with check (
    public.is_admin(auth.uid()) or author_id = auth.uid()
  );

-- Allow delete: admin or owner
create policy posts_delete_admin_or_owner on public.posts
  for delete using (
    public.is_admin(auth.uid()) or author_id = auth.uid()
  );

-- PROFILES table policies
alter table if exists public.profiles enable row level security;

-- Drop old policies if they exist
drop policy if exists profiles_select_admin_or_self on public.profiles;
drop policy if exists profiles_update_admin_or_self on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;

-- Allow select: admin or owner (owner can view self)
create policy profiles_select_admin_or_self on public.profiles
  for select using (
    public.is_admin(auth.uid()) or id = auth.uid()
  );

-- Allow authenticated users to create their own profile after login/signup
create policy profiles_insert_own on public.profiles
  for insert with check (
    auth.uid() is not null and id = auth.uid()
  );

-- Allow update: admin or owner
create policy profiles_update_admin_or_self on public.profiles
  for update using (
    public.is_admin(auth.uid()) or id = auth.uid()
  ) with check (
    public.is_admin(auth.uid()) or id = auth.uid()
  );

-- COMMENTS table policies
alter table if exists public.comments enable row level security;

-- Drop old policies if they exist
drop policy if exists comments_select_on_post_published_or_admin on public.comments;
drop policy if exists comments_insert_authenticated on public.comments;
drop policy if exists comments_delete_admin_or_author on public.comments;

-- Allow select for all comments on published posts or admin
create policy comments_select_on_post_published_or_admin on public.comments
  for select using (
    exists(select 1 from public.posts p where p.id = public.comments.post_id and p.status = 'published')
    or public.is_admin(auth.uid())
  );

-- Allow insert: authenticated users
create policy comments_insert_authenticated on public.comments
  for insert with check (
    (auth.uid() is not null and author_id = auth.uid() and (
      select coalesce(is_banned, false) from public.profiles where id = auth.uid()
    ) = false) or public.is_admin(auth.uid())
  );

-- Allow delete: admin or comment author
create policy comments_delete_admin_or_author on public.comments
  for delete using (
    public.is_admin(auth.uid()) or author_id = auth.uid()
  );
