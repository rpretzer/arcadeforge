-- Games table
create table games (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  url text not null,
  tags text[] default '{}',
  genre text not null check (genre in ('runner', 'arena', 'puzzle')),
  thumbnail_url text,
  creator_name text not null,
  created_at timestamptz default now(),
  status text default 'pending' check (status in ('pending', 'approved', 'rejected'))
);

-- Ratings table
create table ratings (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references games(id) on delete cascade,
  score integer not null check (score >= 1 and score <= 5),
  comment text default '',
  created_at timestamptz default now()
);

-- Enable RLS
alter table games enable row level security;
alter table ratings enable row level security;

-- Policies: anyone can read approved games
create policy "Anyone can read approved games" on games for select using (status = 'approved');
-- Anyone can insert games (they start as pending)
create policy "Anyone can submit games" on games for insert with check (status = 'pending');
-- Anyone can read ratings
create policy "Anyone can read ratings" on ratings for select using (true);
-- Anyone can add ratings
create policy "Anyone can add ratings" on ratings for insert with check (true);

-- Only service role (admin) can update game status
create policy "Service role can update games" on games for update using (
  (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
);
