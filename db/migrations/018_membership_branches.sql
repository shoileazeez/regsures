alter table business_memberships add column if not exists branch_id bigint references branches(id) on delete set null;
create index if not exists business_memberships_branch_id_idx on business_memberships(branch_id);
