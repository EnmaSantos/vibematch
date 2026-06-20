alter table public.movies
  add column if not exists catalog_batch text,
  add column if not exists catalog_rank integer,
  add column if not exists catalog_refreshed_at timestamp with time zone;

create index if not exists movies_catalog_batch_rank_idx
  on public.movies (catalog_batch, catalog_rank)
  where catalog_batch is not null;

drop policy if exists "Allow authenticated users to insert/update movies" on public.movies;

revoke insert, update, delete on public.movies from authenticated;
grant select on public.movies to authenticated;
