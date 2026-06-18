create table if not exists public.movies (
  id text primary key, -- tmdb-{id}
  tmdb_id integer unique not null,
  imdb_id text,
  title text not null,
  overview text,
  poster_url text,
  backdrop_url text,
  release_date text,
  runtime_minutes integer,
  genres text[],
  tmdb_rating numeric,
  imdb_rating numeric,
  poster_theme jsonb,
  watch_providers jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.movies enable row level security;

drop policy if exists "Allow public read access to movies" on public.movies;
create policy "Allow public read access to movies" on public.movies
  for select using (true);

drop policy if exists "Allow authenticated users to insert/update movies" on public.movies;
create policy "Allow authenticated users to insert/update movies" on public.movies
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.movies to authenticated;
grant select on public.movies to anon;
