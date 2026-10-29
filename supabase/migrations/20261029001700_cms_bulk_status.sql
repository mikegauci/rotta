create function private.admin_bulk_status(target_table text,target_ids uuid[],new_status public.publish_status) returns integer language plpgsql security definer set search_path='' as $$
declare affected integer;
begin
 if auth.uid() is null or not coalesce(private.is_admin(),false) then raise exception 'Not authorised'; end if;
 if target_table <> all(array['posts','businesses','events','products','vehicles']) or coalesce(array_length(target_ids,1),0) not between 1 and 100 then raise exception 'Select between 1 and 100 content records'; end if;
 if target_table='posts' then
 update public.posts set status=new_status,published_at=case when new_status='published' then coalesce(published_at,now()) else published_at end where id=any(target_ids);
 else
 execute format('update public.%I set status=$1 where id=any($2)',target_table) using new_status,target_ids;
 end if;
 get diagnostics affected=row_count;return affected;
end $$;
revoke all on function private.admin_bulk_status(text,uuid[],public.publish_status) from public,anon;
grant execute on function private.admin_bulk_status(text,uuid[],public.publish_status) to authenticated;
create function public.admin_bulk_status(target_table text,target_ids uuid[],new_status public.publish_status) returns integer language sql security invoker set search_path='' as $$select private.admin_bulk_status(target_table,target_ids,new_status)$$;
revoke all on function public.admin_bulk_status(text,uuid[],public.publish_status) from public,anon;
grant execute on function public.admin_bulk_status(text,uuid[],public.publish_status) to authenticated;
do $$declare t text;begin
 foreach t in array array['profiles','video_series','directory_terms','post_categories','post_tags','product_categories','product_variants'] loop
 execute format('create trigger cms_history after insert or update or delete on public.%I for each row execute function private.capture_content_history()',t);
 end loop;
end $$;
