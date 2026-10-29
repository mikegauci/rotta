-- Public author names for the blog. Profiles are private (RLS), so this
-- exposes only username and name, and only for people with published posts.
create function public.post_authors()
returns table (id uuid, username text, full_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select pr.id, pr.username, pr.full_name
  from public.profiles pr
  where exists (
    select 1 from public.posts p where p.author_id = pr.id and p.status = 'published'
  )
$$;

grant execute on function public.post_authors() to anon, authenticated;
