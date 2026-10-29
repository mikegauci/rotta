-- Sign-up metadata: the registration form sends first/last name, username
-- and an account type. Only 'business' is honoured as a role upgrade; admin
-- can never be self-assigned.

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  wanted_username text := lower(nullif(trim(meta ->> 'username'), ''));
begin
  if wanted_username is not null
     and (wanted_username !~ '^[a-z0-9_.-]{3,32}$'
          or exists (select 1 from public.profiles where lower(username) = wanted_username)) then
    wanted_username := null;
  end if;

  insert into public.profiles (id, email, username, full_name, role)
  values (
    new.id,
    new.email,
    wanted_username,
    nullif(trim(concat_ws(' ', meta ->> 'first_name', meta ->> 'last_name')), ''),
    case when meta ->> 'account_type' = 'business'
      then 'business_owner'::public.app_role
      else 'customer'::public.app_role
    end
  );
  return new;
end;
$$;

-- Lets the registration form tell people a username is taken before signing up.
create function public.username_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(trim(candidate))
  )
$$;

grant execute on function public.username_available(text) to anon, authenticated;
