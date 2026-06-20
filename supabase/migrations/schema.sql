-- Create entries table for carbon tracking history
create table public.entries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  device_id text not null,
  input jsonb not null,
  result jsonb not null,
  user_id uuid references auth.users(id) on delete cascade
);

-- Index device_id, user_id and created_at for fast history lookups
create index entries_device_id_created_at_idx on public.entries (device_id, created_at desc);
create index entries_user_id_created_at_idx on public.entries (user_id, created_at desc);

-- Enable Row Level Security (RLS)
alter table public.entries enable row level security;

-- Allow public anonymous and authenticated inserts
create policy "Allow inserts"
on public.entries
for insert
with check (
  (auth.uid() is not null and user_id = auth.uid()) or
  (auth.uid() is null and user_id is null)
);

-- Allow public select: authenticated user reads their own, or anyone reads anonymous entries
create policy "Allow select"
on public.entries
for select
using (
  (auth.uid() is not null and user_id = auth.uid()) or
  (user_id is null)
);

-- Allow updates (claiming anonymous entries)
create policy "Allow updates"
on public.entries
for update
using (
  (auth.uid() is not null and user_id is null) or
  (auth.uid() is not null and user_id = auth.uid())
)
with check (
  (auth.uid() is not null and user_id = auth.uid())
);
