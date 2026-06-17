alter table public.sessions
  add column if not exists title text not null default 'Movie night',
  add column if not exists filters jsonb not null default '{"moods":[],"runtime":"Anything","genres":[],"releaseAge":"Any year","animationPreference":"Either"}'::jsonb,
  add column if not exists starts_at timestamp with time zone,
  add column if not exists expires_at timestamp with time zone,
  add column if not exists completed_at timestamp with time zone;

update public.sessions
set starts_at = coalesce(starts_at, created_at),
    expires_at = coalesce(expires_at, created_at + make_interval(secs => duration_seconds));

alter table public.swipes
  add constraint swipes_session_user_movie_unique unique (session_id, user_id, movie_id);

create table if not exists public.session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'participant' check (role in ('host', 'participant')),
  joined_at timestamp with time zone not null default timezone('utc'::text, now()),
  last_seen_at timestamp with time zone not null default timezone('utc'::text, now()),
  unique (session_id, user_id)
);

insert into public.session_participants (session_id, user_id, role, joined_at, last_seen_at)
select id, creator_id, 'host', created_at, timezone('utc'::text, now())
from public.sessions
on conflict (session_id, user_id) do nothing;

alter table public.session_participants enable row level security;

grant select, insert, update, delete on public.session_participants to authenticated;
grant select, update on public.sessions to authenticated;
grant select, insert, update on public.swipes to authenticated;

create policy "Allow session members to view participants"
  on public.session_participants
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.session_participants self
      where self.session_id = session_participants.session_id
        and self.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.sessions s
      where s.id = session_participants.session_id
        and s.creator_id = auth.uid()
    )
  );

create policy "Allow authenticated users to join sessions"
  on public.session_participants
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.sessions s
      where s.id = session_id
        and s.status in ('draft', 'live')
    )
  );

create policy "Allow users to update their session presence"
  on public.session_participants
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Allow users to leave sessions"
  on public.session_participants
  for delete
  to authenticated
  using (user_id = auth.uid() and role <> 'host');

create policy "Allow users to update their swipes"
  on public.swipes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
