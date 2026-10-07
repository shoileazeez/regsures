alter table users add column if not exists email_verified_at timestamptz;
create table if not exists verification_codes (id bigserial primary key, user_id bigint not null references users(id) on delete cascade, code_hash text not null, expires_at timestamptz not null, used_at timestamptz, created_at timestamptz not null default now());
create index if not exists verification_codes_user_id_idx on verification_codes(user_id);
