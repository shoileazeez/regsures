alter table businesses add column if not exists plan text not null default 'free' check (plan in ('free','basic','pro'));
