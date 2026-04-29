export const schemaSql = `
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  date timestamptz not null default timezone('utc', now()),
  direction text not null default 'long' check (direction in ('long', 'short')),
  entry_price numeric(18, 8) not null default 0,
  stop_loss numeric(18, 8) not null default 0,
  take_profit numeric(18, 8) not null default 0,
  exit_price numeric(18, 8) not null default 0,
  lot_size numeric(18, 8) not null default 0,
  session text not null default '',
  strategy text not null default '',
  notes text not null default '',
  tags jsonb not null default '[]'::jsonb,
  mistakes jsonb not null default '[]'::jsonb,
  screenshots jsonb not null default '[]'::jsonb,
  status text not null default 'closed' check (status in ('open', 'closed')),
  account text not null default '',
  pnl numeric(18, 8) not null default 0,
  risk_reward numeric(18, 8) not null default 0,
  outcome text not null default 'breakeven' check (outcome in ('win', 'loss', 'breakeven')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.backtest_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  symbol text not null,
  timeframe text not null,
  starting_balance numeric(18, 8) not null default 10000,
  current_balance numeric(18, 8) not null default 10000,
  cursor_position integer not null default 0,
  start_date date not null,
  end_date date,
  status text not null default 'active' check (status in ('draft', 'active', 'archived', 'completed')),
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.backtest_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.backtest_sessions(id) on delete cascade,
  symbol text not null,
  direction text not null check (direction in ('long', 'short')),
  lot_size numeric(18, 8) not null default 0,
  entry_price numeric(18, 8) not null default 0,
  stop_loss numeric(18, 8) not null default 0,
  take_profit numeric(18, 8) not null default 0,
  exit_price numeric(18, 8),
  risk_reward numeric(18, 8) not null default 0,
  pnl numeric(18, 8) not null default 0,
  result text not null default 'breakeven' check (result in ('win', 'loss', 'breakeven')),
  status text not null default 'open' check (status in ('open', 'closed')),
  open_time timestamptz not null default timezone('utc', now()),
  close_time timestamptz,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Backtest extended columns (safe to re-run)
alter table public.backtest_sessions
  add column if not exists asset_type text not null default 'forex',
  add column if not exists is_private boolean not null default true,
  add column if not exists prop_firm_mode boolean not null default false,
  add column if not exists prop_rules jsonb,
  add column if not exists current_replay_date date;

-- Journal source tracking
alter table public.trades
  add column if not exists source text not null default 'manual',
  add column if not exists backtest_session_id uuid references public.backtest_sessions(id) on delete set null;

create index if not exists trades_user_date_idx
  on public.trades (user_id, date desc);

create index if not exists backtest_sessions_user_created_idx
  on public.backtest_sessions (user_id, created_at desc);

create index if not exists backtest_trades_session_open_idx
  on public.backtest_trades (session_id, open_time asc);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trades_set_updated_at') then
    create trigger trades_set_updated_at
      before update on public.trades
      for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'backtest_sessions_set_updated_at') then
    create trigger backtest_sessions_set_updated_at
      before update on public.backtest_sessions
      for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'backtest_trades_set_updated_at') then
    create trigger backtest_trades_set_updated_at
      before update on public.backtest_trades
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.trades enable row level security;
alter table public.backtest_sessions enable row level security;
alter table public.backtest_trades enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'trades'
      and policyname = 'Users can manage their own trades'
  ) then
    create policy "Users can manage their own trades"
      on public.trades
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'backtest_sessions'
      and policyname = 'Users can manage their own backtest sessions'
  ) then
    create policy "Users can manage their own backtest sessions"
      on public.backtest_sessions
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'backtest_trades'
      and policyname = 'Users can manage their own backtest trades'
  ) then
    create policy "Users can manage their own backtest trades"
      on public.backtest_trades
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end;
$$;

-- MT5 auto-sync: deduplication column
alter table public.trades
  add column if not exists broker_ticket_id text;

create unique index if not exists trades_user_broker_ticket_uniq
  on public.trades (user_id, broker_ticket_id)
  where broker_ticket_id is not null;

-- MT5 auto-sync: API keys table
create table if not exists public.mt5_api_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  key_hash     text not null unique,
  label        text not null default '',
  is_active    boolean not null default true,
  last_used_at timestamptz,
  created_at   timestamptz not null default timezone('utc', now())
);

create index if not exists mt5_api_keys_user_idx on public.mt5_api_keys (user_id);

alter table public.mt5_api_keys enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'mt5_api_keys'
      and policyname = 'Users can manage their own MT5 API keys'
  ) then
    create policy "Users can manage their own MT5 API keys"
      on public.mt5_api_keys
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end;
$$;
`;
