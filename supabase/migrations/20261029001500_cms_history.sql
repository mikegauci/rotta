create table public.content_history (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 actor_id uuid references auth.users(id) on delete set null,
 entity text not null, record_key text not null, operation text not null,
 before_data jsonb, after_data jsonb
);
create index content_history_recent on public.content_history(created_at desc);
alter table public.content_history enable row level security;
grant select on public.content_history to authenticated;
revoke all on public.content_history from anon;
create policy "Admins read history" on public.content_history for select to authenticated using ((select private.is_admin()));
create function private.capture_content_history() returns trigger language plpgsql security definer set search_path = '' as $$
declare previous jsonb; current_row jsonb;
begin
 if TG_OP <> 'INSERT' then previous := to_jsonb(OLD); end if;
 if TG_OP <> 'DELETE' then current_row := to_jsonb(NEW); end if;
 if TG_OP = 'UPDATE' and previous - 'updated_at' = current_row - 'updated_at' then return NEW; end if;
 insert into public.content_history(actor_id,entity,record_key,operation,before_data,after_data)
 values(auth.uid(),TG_TABLE_NAME,coalesce(current_row->>'id',previous->>'id',current_row->>'key',previous->>'key',current_row->>'source',previous->>'source'),TG_OP,previous,current_row);
 if TG_OP = 'DELETE' then return OLD; end if; return NEW;
end $$;
revoke all on function private.capture_content_history() from public,anon,authenticated;
do $$ declare t text; begin
 foreach t in array array['posts','pages','events','businesses','products','vehicles','videos','redirects','settings','media'] loop
 execute format('create trigger cms_history after insert or update or delete on public.%I for each row execute function private.capture_content_history()',t);
 end loop;
end $$;
