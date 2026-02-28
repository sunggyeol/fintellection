create index if not exists research_sessions_user_id_idx
  on public.research_sessions(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "watchlists_select_own" on public.watchlists;
create policy "watchlists_select_own"
on public.watchlists
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "watchlists_insert_own" on public.watchlists;
create policy "watchlists_insert_own"
on public.watchlists
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "watchlists_update_own" on public.watchlists;
create policy "watchlists_update_own"
on public.watchlists
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "watchlists_delete_own" on public.watchlists;
create policy "watchlists_delete_own"
on public.watchlists
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "research_select_own" on public.research_sessions;
create policy "research_select_own"
on public.research_sessions
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "research_insert_own" on public.research_sessions;
create policy "research_insert_own"
on public.research_sessions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "research_update_own" on public.research_sessions;
create policy "research_update_own"
on public.research_sessions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "research_delete_own" on public.research_sessions;
create policy "research_delete_own"
on public.research_sessions
for delete
to authenticated
using ((select auth.uid()) = user_id);
