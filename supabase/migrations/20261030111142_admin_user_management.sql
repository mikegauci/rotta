-- null capabilities means full administrator; arrays grant only named CMS sections.
alter table public.profiles add column admin_capabilities text[];
alter table public.profiles add constraint valid_admin_capabilities check (
 (role='admin' or admin_capabilities is null) and
 (admin_capabilities is null or admin_capabilities <@ array['pages','posts','directory','events','videos','marketplace','products','orders','media']::text[])
);
create or replace function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin' and admin_capabilities is null)
$$;
create function private.has_admin_capability(capability text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin' and (admin_capabilities is null or capability=any(admin_capabilities)))
$$;
revoke all on function private.has_admin_capability(text) from public;
grant execute on function private.has_admin_capability(text) to anon,authenticated;

-- Replace existing admin predicates in each section's policies; preserve public/owner rules.
do $$ declare r record; scope text; statement text; begin
 for r in select * from pg_policies where schemaname in ('public','storage') loop
  scope := case when r.schemaname='storage' and r.tablename='objects' then 'media' else
   case r.tablename
    when 'pages' then 'pages'
    when 'posts' then 'posts' when 'post_categories' then 'posts' when 'post_tags' then 'posts' when 'post_category_links' then 'posts' when 'post_tag_links' then 'posts'
    when 'businesses' then 'directory' when 'business_terms' then 'directory' when 'directory_terms' then 'directory'
    when 'events' then 'events'
    when 'videos' then 'videos' when 'video_series' then 'videos'
    when 'vehicles' then 'marketplace' when 'vehicle_media' then 'marketplace'
    when 'products' then 'products' when 'product_variants' then 'products' when 'product_media' then 'products' when 'product_categories' then 'products' when 'product_tags' then 'products' when 'product_category_links' then 'products' when 'product_tag_links' then 'products'
    when 'orders' then 'orders' when 'order_items' then 'orders' when 'order_notes' then 'orders'
    when 'media' then 'media' end end;
  if scope is not null and (coalesce(r.qual,'')||coalesce(r.with_check,'')) like '%private.is_admin()%' then
   statement := format('alter policy %I on %I.%I',r.policyname,r.schemaname,r.tablename);
   if r.qual is not null then statement := statement || ' using (' || replace(r.qual,'private.is_admin()',format('private.has_admin_capability(%L)',scope)) || ')'; end if;
   if r.with_check is not null then statement := statement || ' with check (' || replace(r.with_check,'private.is_admin()',format('private.has_admin_capability(%L)',scope)) || ')'; end if;
   execute statement;
  end if;
 end loop;
 -- Scoped admins need the same checks in the existing product/directory RPCs.
 for r in select p.oid,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('admin_save_product','admin_update_business') loop
  scope := case r.proname when 'admin_save_product' then 'products' else 'directory' end;
  execute replace(pg_get_functiondef(r.oid),'private.is_admin()',format('private.has_admin_capability(%L)',scope));
 end loop;
end $$;

-- A deleted account's unexpired access token must not retain business-folder upload rights.
alter policy "Business owners upload their logo" on storage.objects
 with check (bucket_id='media' and (storage.foldername(name))[1]='business' and (storage.foldername(name))[2]=(select auth.uid())::text and (select private.user_role()) in ('business_owner','admin'));

create function private.protect_last_full_admin() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.role='admin' and old.admin_capabilities is null then
  if TG_OP='UPDATE' and new.role='admin' and new.admin_capabilities is null then return new; end if;
  perform pg_advisory_xact_lock(7244771);
  if not exists(select 1 from public.profiles where id<>old.id and role='admin' and admin_capabilities is null) then raise exception 'Keep at least one full administrator.' using errcode='23514'; end if;
 end if;
 if TG_OP='DELETE' then return old; end if;
 return new;
end $$;
revoke all on function private.protect_last_full_admin() from public,anon,authenticated;
create trigger protect_last_full_admin before update of role,admin_capabilities or delete on public.profiles for each row execute function private.protect_last_full_admin();

create or replace function public.set_user_role(target_user uuid,new_role public.app_role) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'Only full administrators can change roles' using errcode='42501'; end if;
 if target_user=auth.uid() then raise exception 'You cannot change your own access.'; end if;
 update public.profiles set role=new_role,admin_capabilities=null where id=target_user;
end $$;

create function public.admin_save_user_profile(target_user uuid,display_name text,new_username text,new_role public.app_role,capabilities text[]) returns void language plpgsql security definer set search_path='' as $$
declare previous public.profiles;
begin
 if not private.is_admin() then raise exception 'Only full administrators can manage users' using errcode='42501'; end if;
 select * into previous from public.profiles where id=target_user for update;
 if not found then raise exception 'User not found.'; end if;
 if target_user=auth.uid() and (previous.role is distinct from new_role or previous.admin_capabilities is distinct from capabilities) then raise exception 'You cannot change your own access.'; end if;
 if length(trim(display_name))>150 or length(trim(new_username))>32 then raise exception 'User details are too long.'; end if;
 update public.profiles set full_name=nullif(trim(display_name),''),username=nullif(lower(trim(new_username)),''),role=new_role,admin_capabilities=case when new_role='admin' then capabilities else null end where id=target_user;
end $$;
revoke all on function public.admin_save_user_profile(uuid,text,text,public.app_role,text[]) from public,anon;
grant execute on function public.admin_save_user_profile(uuid,text,text,public.app_role,text[]) to authenticated;

create function public.admin_list_users(search_text text default '',filter_role text default '',page_number integer default 1) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not private.is_admin() then raise exception 'Only full administrators can manage users' using errcode='42501'; end if;
 if filter_role not in ('','admin','business_owner','customer') then raise exception 'Unknown role.'; end if;
 with filtered as (
  select id,email,username,full_name,role,admin_capabilities,created_at from public.profiles
  where (filter_role='' or role::text=filter_role) and (trim(search_text)='' or strpos(lower(coalesce(full_name,'')||' '||coalesce(username,'')||' '||email),lower(left(trim(search_text),200)))>0)
 ), totals as (select count(*)::integer as total from filtered), pagination as (
  select total,greatest(1,(total+49)/50) as pages,least(greatest(1,coalesce(page_number,1)),greatest(1,(total+49)/50)) as page from totals
 ) select jsonb_build_object('total',total,'pages',pages,'page',page,'users',coalesce((select jsonb_agg(to_jsonb(u) order by u.created_at desc,u.id) from (select * from filtered order by created_at desc,id limit 50 offset ((select page from pagination)-1)*50) u),'[]'::jsonb)) into result from pagination;
 return result;
end $$;
revoke all on function public.admin_list_users(text,text,integer) from public,anon;
grant execute on function public.admin_list_users(text,text,integer) to authenticated;

-- Retain public uploads when deleting an account through the Auth Admin API.
create function public.admin_release_user_files(target_user uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() or target_user=auth.uid() then raise exception 'Not authorised' using errcode='42501'; end if;
 if not exists(select 1 from public.profiles where id=target_user) then raise exception 'User not found.'; end if;
 update storage.objects set owner=null,owner_id=null where owner_id=target_user::text or owner=target_user;
end $$;
revoke all on function public.admin_release_user_files(uuid) from public,anon;
grant execute on function public.admin_release_user_files(uuid) to authenticated;

-- Directory editors can assign owners without gaining access to full user profiles.
create function public.admin_directory_owner_id(candidate text) returns uuid language plpgsql stable security definer set search_path='' as $$
begin
 if not private.has_admin_capability('directory') then raise exception 'Not authorised' using errcode='42501'; end if;
 return (select id from public.profiles where lower(email)=lower(trim(candidate)) limit 1);
end $$;
create function public.admin_directory_owner_email(listing_id uuid) returns text language plpgsql stable security definer set search_path='' as $$
begin
 if not private.has_admin_capability('directory') then raise exception 'Not authorised' using errcode='42501'; end if;
 return (select p.email from public.businesses b join public.profiles p on p.id=b.owner_id where b.id=listing_id);
end $$;
revoke all on function public.admin_directory_owner_id(text) from public,anon;
revoke all on function public.admin_directory_owner_email(uuid) from public,anon;
grant execute on function public.admin_directory_owner_id(text),public.admin_directory_owner_email(uuid) to authenticated;

-- Keep canonical redirects working without granting access to the site-wide redirect manager.
create function private.admin_content_redirect() returns trigger language plpgsql security definer set search_path='' as $$
declare prefix text; scope text;
begin
 if old.slug is not distinct from new.slug or old.status<>'published' then return new; end if;
 prefix := case TG_TABLE_NAME when 'businesses' then '/directory/' when 'events' then '/events/' when 'products' then '/product/' when 'vehicles' then '/marketplace/' else '/' end;
 scope := case TG_TABLE_NAME when 'businesses' then 'directory' when 'vehicles' then 'marketplace' else TG_TABLE_NAME end;
 if private.has_admin_capability(scope) then
  insert into public.redirects(source,destination,permanent) values(prefix||old.slug||'/',prefix||new.slug||'/',true) on conflict(source) do update set destination=excluded.destination,permanent=true;
 end if;
 return new;
end $$;
revoke all on function private.admin_content_redirect() from public,anon,authenticated;
do $$ declare t text; begin
 foreach t in array array['posts','businesses','events','products','vehicles'] loop
  execute format('create trigger admin_content_redirect after update of slug on public.%I for each row execute function private.admin_content_redirect()',t);
 end loop;
end $$;
