-- =====================================================================
-- ChessHost — Supabase schema
-- Run this whole file once in: Supabase Dashboard → SQL Editor → New query
-- =====================================================================
create extension if not exists pgcrypto;

-- ---------- tables ----------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  email       text,
  plan        text not null default 'free' check (plan in ('free','pro')),
  created_at  timestamptz not null default now()
);

create table public.members (               -- "My Players" saved roster
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name        text not null,
  email       text,
  created_at  timestamptz not null default now()
);

create table public.tournaments (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name               text not null,
  format             text not null default 'swiss'  check (format in ('swiss','round_robin','knockout')),
  speed              text not null default 'rapid'  check (speed in ('blitz','rapid','social')),
  clock_minutes      int,                                   -- null = no clock
  event_date         date not null default current_date,
  status             text not null default 'draft'  check (status in ('draft','live','finished')),
  current_round      int  not null default 0,
  total_rounds       int  not null default 3,
  slug               text not null unique default encode(gen_random_bytes(5), 'hex'),
  registration_open  boolean not null default true,
  tv_theme           text not null default 'casual' check (tv_theme in ('casual','esports','kids')),
  created_at         timestamptz not null default now()
);

create table public.players (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references public.tournaments(id) on delete cascade,
  member_id      uuid references public.members(id) on delete set null,
  name           text not null,
  created_at     timestamptz not null default now()
);
create index on public.players (tournament_id);

create table public.games (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references public.tournaments(id) on delete cascade,
  round          int  not null,
  board          int  not null,
  white_id       uuid not null references public.players(id) on delete cascade,
  black_id       uuid references public.players(id) on delete cascade,   -- null = bye
  result         text check (result in ('1-0','0-1','1/2-1/2')),
  unique (tournament_id, round, board)
);
create index on public.games (tournament_id);

-- ---------- auto-create a profile on sign-up ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Free plan limits (1 event / month, 12 players) ----------
create or replace function public.owner_plan(uid uuid) returns text
language sql stable security definer set search_path = public as $$
  select plan from public.profiles where id = uid
$$;

create or replace function public.enforce_tournament_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.owner_plan(new.owner_id) = 'free' and exists (
    select 1 from public.tournaments
    where owner_id = new.owner_id
      and date_trunc('month', created_at) = date_trunc('month', now())
  ) then
    raise exception 'FREE_LIMIT_EVENTS';
  end if;
  return new;
end $$;

create trigger tournaments_free_limit
  before insert on public.tournaments
  for each row execute function public.enforce_tournament_limit();

create or replace function public.enforce_player_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select owner_id into owner from public.tournaments where id = new.tournament_id;
  if public.owner_plan(owner) = 'free'
     and (select count(*) from public.players where tournament_id = new.tournament_id) >= 12 then
    raise exception 'FREE_LIMIT_PLAYERS';
  end if;
  return new;
end $$;

create trigger players_free_limit
  before insert on public.players
  for each row execute function public.enforce_player_limit();

-- ---------- public self-registration (QR / invite link) ----------
create or replace function public.join_tournament(p_slug text, p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare t public.tournaments; pid uuid; n text := btrim(p_name);
begin
  select * into t from public.tournaments where slug = p_slug;
  if not found then raise exception 'Tournament not found'; end if;
  if t.status <> 'draft' or not t.registration_open then raise exception 'Registration is closed'; end if;
  if length(n) < 2 or length(n) > 40 then raise exception 'Enter a name between 2 and 40 characters'; end if;
  if exists (select 1 from public.players where tournament_id = t.id and lower(name) = lower(n)) then
    raise exception 'That name is already registered';
  end if;
  insert into public.players (tournament_id, name) values (t.id, n) returning id into pid;
  return pid;
end $$;

grant execute on function public.join_tournament(text, text) to anon, authenticated;

-- ---------- Row Level Security ----------
alter table public.profiles    enable row level security;
alter table public.members     enable row level security;
alter table public.tournaments enable row level security;
alter table public.players     enable row level security;
alter table public.games       enable row level security;

-- profiles: you only see/edit yourself, and can never change your own plan
create policy "profile read own"   on public.profiles for select using (auth.uid() = id);
create policy "profile update own" on public.profiles for update using (auth.uid() = id);
revoke update on public.profiles from anon, authenticated;
grant  update (full_name, email) on public.profiles to authenticated;

-- members: private to the organiser
create policy "members own" on public.members for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- tournaments / players / games: PUBLIC READ (needed for TV display + join page), owner-only write
create policy "tournaments read"   on public.tournaments for select using (true);
create policy "tournaments insert" on public.tournaments for insert with check (owner_id = auth.uid());
create policy "tournaments update" on public.tournaments for update using (owner_id = auth.uid());
create policy "tournaments delete" on public.tournaments for delete using (owner_id = auth.uid());

create policy "players read"  on public.players for select using (true);
create policy "players write" on public.players for all
  using      (exists (select 1 from public.tournaments t where t.id = tournament_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from public.tournaments t where t.id = tournament_id and t.owner_id = auth.uid()));

create policy "games read"  on public.games for select using (true);
create policy "games write" on public.games for all
  using      (exists (select 1 from public.tournaments t where t.id = tournament_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from public.tournaments t where t.id = tournament_id and t.owner_id = auth.uid()));

-- ---------- Realtime (live TV display + control room sync) ----------
alter publication supabase_realtime add table public.tournaments, public.players, public.games;
