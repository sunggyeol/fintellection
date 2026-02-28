create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  symbols text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists watchlists_user_name_ci_idx
  on public.watchlists(user_id, lower(name));

create table if not exists public.research_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  query text not null,
  response text not null default '',
  symbols_referenced text[] not null default '{}'::text[],
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists watchlists_set_updated_at on public.watchlists;
create trigger watchlists_set_updated_at
before update on public.watchlists
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.watchlists enable row level security;
alter table public.research_sessions enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "watchlists_select_own" on public.watchlists;
create policy "watchlists_select_own"
on public.watchlists
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "watchlists_insert_own" on public.watchlists;
create policy "watchlists_insert_own"
on public.watchlists
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "watchlists_update_own" on public.watchlists;
create policy "watchlists_update_own"
on public.watchlists
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "watchlists_delete_own" on public.watchlists;
create policy "watchlists_delete_own"
on public.watchlists
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "research_select_own" on public.research_sessions;
create policy "research_select_own"
on public.research_sessions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "research_insert_own" on public.research_sessions;
create policy "research_insert_own"
on public.research_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "research_update_own" on public.research_sessions;
create policy "research_update_own"
on public.research_sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "research_delete_own" on public.research_sessions;
create policy "research_delete_own"
on public.research_sessions
for delete
to authenticated
using (auth.uid() = user_id);
