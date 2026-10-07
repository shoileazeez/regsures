create table if not exists whatsapp_link_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  code_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists whatsapp_link_codes_active_idx on whatsapp_link_codes(code_hash, expires_at) where used_at is null;
