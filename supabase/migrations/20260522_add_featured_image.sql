-- Add featured_image_url column to posts table
alter table public.posts add column if not exists featured_image_url text;

-- Add comment for clarity
comment on column public.posts.featured_image_url is 'URL to the featured image for the post, stored in Supabase Storage';
