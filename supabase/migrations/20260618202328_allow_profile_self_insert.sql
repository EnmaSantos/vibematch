create policy "Allow users to insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);
