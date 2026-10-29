-- Profiles and roles.
-- Every auth user gets a profile. Roles: admin (full CMS), business_owner
-- (manages only their own directory listing), customer (shop account).

create type public.app_role as enum ('admin', 'business_owner', 'customer');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  username text,
  full_name text,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format
    check (username is null or username ~ '^[a-z0-9_.-]{3,32}$')
);

create unique index profiles_username_key on public.profiles (lower(username));
create index profiles_role_idx on public.profiles (role);

comment on table public.profiles is 'One row per auth user. Role changes go through public.set_user_role().';

-- Helpers live in a schema that the Data API does not expose.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

create function private.user_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.user_role() = 'admin', false)
$$;

grant execute on function private.user_role() to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;

create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function private.touch_updated_at();

-- Create a profile whenever a user signs up, and keep the email in sync.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create function private.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function private.handle_user_email_change();

-- Row level security.
alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Admins can read all profiles"
  on public.profiles for select
  to authenticated
  using ((select private.is_admin()));

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Admins can update any profile"
  on public.profiles for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Users may only edit these columns directly; role and email are protected.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (username, full_name) on public.profiles to authenticated;

-- Role changes: admins only.
create function public.set_user_role(target_user uuid, new_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Only admins can change roles' using errcode = '42501';
  end if;
  update public.profiles set role = new_role where id = target_user;
end;
$$;

revoke execute on function public.set_user_role(uuid, public.app_role) from public, anon;
grant execute on function public.set_user_role(uuid, public.app_role) to authenticated;
