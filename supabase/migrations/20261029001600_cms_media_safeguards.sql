revoke insert, update, delete on public.content_history from authenticated;
create function private.protect_used_media() returns trigger language plpgsql security definer set search_path='' as $$
declare t text; used boolean;
begin
 if OLD.path = any(array['wp/2021/01/Ferrari-250GT-1-1024x669-1.webp','wp/2021/01/Parsons-Maserati-1.webp','wp/2021/01/rotta-video-bg.mp4','wp/2021/01/stories-title-1.webp','wp/2021/05/DSC01475.webp','wp/2021/05/shop-banner-image.webp','wp/2023/06/Blogs-Thumbnails-600x315-13.webp']) then raise exception 'This file is used by the website layout.'; end if;
 foreach t in array array['posts','pages','businesses','events','products','vehicles','videos','video_series','product_media','vehicle_media','directory_terms','product_categories','product_variants','settings'] loop
 execute format('select exists(select 1 from public.%I r where strpos(to_jsonb(r)::text,$1)>0 or strpos(to_jsonb(r)::text,$2)>0)',t) into used using OLD.id::text,OLD.path;
 if used then raise exception 'This file is used by %. Remove its content references first.',t; end if;
 end loop;
 if exists(select 1 from public.content_history h where h.entity in ('posts','pages','businesses','events','products','vehicles','videos','video_series') and (strpos(h.before_data::text,OLD.id::text)>0 or strpos(h.before_data::text,OLD.path)>0)) then raise exception 'This file is retained by a saved content revision.'; end if;
 return OLD;
end $$;
revoke all on function private.protect_used_media() from public,anon,authenticated;
create trigger protect_used_media before delete on public.media for each row execute function private.protect_used_media();
