alter table businesses add column if not exists plan_started_at timestamptz;
alter table businesses add column if not exists plan_expires_at timestamptz;
alter table businesses add column if not exists grace_until timestamptz;
alter table businesses add column if not exists notification_email boolean not null default true;
alter table businesses add column if not exists restock_notifications boolean not null default true;
alter table businesses add column if not exists payment_notifications boolean not null default true;
alter table users add column if not exists phone text;
