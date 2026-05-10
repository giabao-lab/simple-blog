-- Supabase Storage for post images

insert into storage.buckets (id, name, public)
select 'post-images', 'post-images', true
where not exists (
  select 1 from storage.buckets where id = 'post-images'
);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public can read post images'
  ) then
    create policy "Public can read post images"
      on storage.objects
      for select
      to public
      using (bucket_id = 'post-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can upload post images'
  ) then
    create policy "Authenticated users can upload post images"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'post-images'
        and name like auth.uid()::text || '/%'
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can update their own post images'
  ) then
    create policy "Users can update their own post images"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'post-images'
        and name like auth.uid()::text || '/%'
      )
      with check (
        bucket_id = 'post-images'
        and name like auth.uid()::text || '/%'
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can delete their own post images'
  ) then
    create policy "Users can delete their own post images"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'post-images'
        and name like auth.uid()::text || '/%'
      );
  end if;
end $$;
