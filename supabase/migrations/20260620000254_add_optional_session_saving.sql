alter table public.session_participants
  add column if not exists saved_at timestamp with time zone;

comment on column public.session_participants.saved_at is
  'Set only when this participant explicitly saves the session to their history.';

create index if not exists session_participants_saved_history_idx
  on public.session_participants (user_id, saved_at desc)
  where saved_at is not null;
