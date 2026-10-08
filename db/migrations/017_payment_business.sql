alter table payments add column if not exists business_id bigint references businesses(id) on delete cascade;

update payments p
set business_id = (
  select b.id
  from businesses b
  where b.owner_id = p.user_id
  order by b.created_at desc
  limit 1
)
where p.business_id is null;

create index if not exists payments_business_id_idx on payments(business_id);
