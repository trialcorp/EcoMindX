-- 1. Create profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on profiles
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Allow public read profiles" on public.profiles
  for select using (true);

create policy "Allow user update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 2. Trigger to automatically create a profile row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger safely
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Create community_tips table
create table if not exists public.community_tips (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  category text not null,
  title text not null,
  description text not null,
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null
);

-- Enable RLS on community_tips
alter table public.community_tips enable row level security;

-- Policies for community_tips
create policy "Allow public read community_tips" on public.community_tips
  for select using (true);

create policy "Allow authenticated/anon insert community_tips" on public.community_tips
  for insert with check (true);

-- 4. Create Leaderboard view
-- Selects the latest carbon footprint score (total_annual_tonnes) for each user, and unions static seed users
create or replace view public.leaderboard as
with latest_entries as (
  select distinct on (user_id)
    user_id,
    created_at,
    (result->>'total_annual_tonnes')::numeric as score
  from public.entries
  where user_id is not null
  order by user_id, created_at desc
)
select
  p.id as user_id,
  coalesce(p.display_name, split_part(p.email, '@', 1)) as display_name,
  le.score,
  le.created_at as last_calculated_at
from public.profiles p
join latest_entries le on p.id = le.user_id

union all

-- Seed/Mock users
select
  '8a834e56-1111-4444-8888-222233334444'::uuid as user_id,
  'Sophia Green' as display_name,
  1.2 as score,
  now() - interval '3 days' as last_calculated_at
union all
select
  '8a834e56-2222-4444-8888-222233334444'::uuid as user_id,
  'Leo EcoCommuter' as display_name,
  1.8 as score,
  now() - interval '5 days' as last_calculated_at
union all
select
  '8a834e56-3333-4444-8888-222233334444'::uuid as user_id,
  'Mia Forest' as display_name,
  2.1 as score,
  now() - interval '7 days' as last_calculated_at
union all
select
  '8a834e56-4444-4444-8888-222233334444'::uuid as user_id,
  'Oliver Wind' as display_name,
  3.5 as score,
  now() - interval '10 days' as last_calculated_at;

-- 4b. Create function to calculate collective CO2e saved (bypasses RLS using security definer)
create or replace function public.get_collective_saved_kg()
returns numeric as $$
  with latest_entries as (
    select distinct on (user_id)
      user_id,
      (result->>'total_annual_kg')::numeric as total_annual_kg
    from public.entries
    where user_id is not null
    order by user_id, created_at desc
  )
  -- Real entries savings + seed users savings (10600 kg) + base offset (37650 kg) = 48250 kg initial collective saved
  select coalesce(sum(greatest(0, 4800 - total_annual_kg)), 0) + 48250 as collective_saved_kg
  from latest_entries;
$$ language sql security definer;

-- 5. Seed community tips (idempotent setup, no FK dependencies on auth.users)
delete from public.community_tips where author_name in ('Sophia Green', 'Leo EcoCommuter', 'Mia Forest');

insert into public.community_tips (category, title, description, author_name, user_id) values
  ('Mobility', 'Inflate your car tires!', 'Under-inflated tires increase rolling resistance, which uses more fuel. Keeping them inflated saves up to 3% in fuel costs.', 'Sophia Green', null),
  ('Home Energy', 'Lower Thermostat by 1°C', 'Turning your home heating thermostat down by just 1 degree Celsius can cut your heating bill (and footprint) by up to 10%.', 'Leo EcoCommuter', null),
  ('Diet', 'Embrace Leftovers', 'Food waste makes up 8% of global greenhouse emissions. Planning meals and utilizing leftovers directly offsets waste footprint.', 'Mia Forest', null);
