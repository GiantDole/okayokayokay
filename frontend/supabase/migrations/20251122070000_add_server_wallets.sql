-- Create server_wallets table to store encrypted wallet data per session
create table if not exists server_wallets (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique, -- Anonymous session ID
  encrypted_private_key text not null, -- Encrypted wallet data (CDP export)
  wallet_address text not null unique, -- Server wallet's public address
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast lookups by session ID
create index idx_server_wallets_session_id on server_wallets(session_id);

-- RLS policies
alter table server_wallets enable row level security;

-- Allow anonymous reads (users can see their wallet address)
create policy "Allow anonymous read server wallets"
  on server_wallets
  for select
  to anon
  using (true);

-- Allow anonymous inserts (for wallet creation)
create policy "Allow anonymous insert server wallets"
  on server_wallets
  for insert
  to anon
  with check (true);

-- Update timestamp trigger
create or replace function update_server_wallets_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger server_wallets_updated_at
  before update on server_wallets
  for each row
  execute function update_server_wallets_updated_at();
