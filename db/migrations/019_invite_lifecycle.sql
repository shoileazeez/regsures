alter table team_invites add column if not exists revoked_at timestamptz;
alter table team_invites add column if not exists revoke_reason text;
create index if not exists team_invites_active_idx on team_invites(business_id, accepted_at, revoked_at, expires_at);
