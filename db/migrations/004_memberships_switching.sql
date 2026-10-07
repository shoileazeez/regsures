create table if not exists business_memberships (id bigserial primary key, business_id bigint not null references businesses(id) on delete cascade, user_id bigint not null references users(id) on delete cascade, role text not null check (role in ('owner','admin','manager','staff')), created_at timestamptz not null default now(), unique (business_id,user_id));
alter table team_invites add column if not exists accepted_by bigint references users(id) on delete set null;
alter table team_invites add column if not exists branch_id bigint references branches(id) on delete set null;
insert into businesses (owner_id,name) select id, coalesce(name,'My business') from users u where not exists (select 1 from businesses b where b.owner_id=u.id);
insert into business_memberships (business_id,user_id,role) select b.id,b.owner_id,'owner' from businesses b where not exists (select 1 from business_memberships m where m.business_id=b.id and m.user_id=b.owner_id);
insert into business_memberships (business_id,user_id,role) select b.id,u.id,u.role from businesses b join users u on u.id=b.owner_id where not exists (select 1 from business_memberships m where m.business_id=b.id and m.user_id=u.id);
create index if not exists business_memberships_user_id_idx on business_memberships(user_id);
