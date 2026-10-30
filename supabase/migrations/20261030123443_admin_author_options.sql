-- Post editors need author names, not unrestricted profile records.
create function public.admin_author_options() returns table(id uuid,display_name text)
language plpgsql stable security definer set search_path='' as $$
begin
 if not private.has_admin_capability('posts') then raise exception 'Not authorised' using errcode='42501'; end if;
 return query select p.id,coalesce(nullif(p.full_name,''),nullif(p.username,''),'Account '||left(p.id::text,8))
 from public.profiles p where p.role='admin' or exists(select 1 from public.posts a where a.author_id=p.id)
 order by 2;
end $$;
revoke all on function public.admin_author_options() from public,anon;
grant execute on function public.admin_author_options() to authenticated;
