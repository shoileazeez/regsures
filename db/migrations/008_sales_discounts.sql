alter table sales add column if not exists subtotal integer not null default 0;
alter table sales add column if not exists discount integer not null default 0;
