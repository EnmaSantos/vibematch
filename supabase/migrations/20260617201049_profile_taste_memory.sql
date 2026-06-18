alter table public.profiles
  add column if not exists release_age_preference text not null default 'Any year',
  add column if not exists animation_preference text not null default 'Either',
  add column if not exists taste_profile jsonb not null default '{"likedGenres":{},"skippedGenres":{},"likedMovies":0,"skippedMovies":0}'::jsonb;

grant select, update on public.profiles to authenticated;
