-- Migration 002: Categories System
-- Create categories table and post_categories association table

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  color text default 'blue',
  icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  constraint name_not_empty check (length(name) > 0),
  constraint slug_not_empty check (length(slug) > 0)
);

-- Create junction table for post-category relationships
create table if not exists public.post_categories (
  post_id uuid not null references public.posts (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, category_id)
);

-- Add indexes
create index idx_categories_slug on public.categories (slug);
create index idx_post_categories_post_id on public.post_categories (post_id);
create index idx_post_categories_category_id on public.post_categories (category_id);

alter table public.categories enable row level security;
alter table public.post_categories enable row level security;

-- RLS Policies for Categories
create policy "Anyone can view categories"
  on public.categories
  for select
  to public
  using (true);

create policy "Only admins can insert categories"
  on public.categories
  for insert
  to authenticated
  with check (false); -- Disable for now, can enable with admin role later

create policy "Only admins can update categories"
  on public.categories
  for update
  to authenticated
  using (false)
  with check (false);

create policy "Only admins can delete categories"
  on public.categories
  for delete
  to authenticated
  using (false);

-- RLS Policies for Post Categories
create policy "Anyone can view post categories"
  on public.post_categories
  for select
  to public
  using (true);

create policy "Post authors can manage their post categories"
  on public.post_categories
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.posts
      where posts.id = post_id
      and posts.author_id = auth.uid()
    )
  );

create policy "Post authors can delete their post categories"
  on public.post_categories
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.posts
      where posts.id = post_id
      and posts.author_id = auth.uid()
    )
  );

-- Create trigger to update updated_at automatically
create or replace function public.update_categories_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_categories_timestamp_trigger
before update on public.categories
for each row
execute function public.update_categories_timestamp();

-- Insert some default categories
insert into public.categories (name, slug, description, color)
values
  ('Technology', 'technology', 'Tech news, tutorials, and tips', 'blue'),
  ('Design', 'design', 'Design patterns, UI/UX tips', 'purple'),
  ('Business', 'business', 'Business insights and strategies', 'green'),
  ('Lifestyle', 'lifestyle', 'Lifestyle and personal development', 'yellow'),
  ('Tutorial', 'tutorial', 'Step-by-step guides and how-tos', 'indigo')
on conflict do nothing;
