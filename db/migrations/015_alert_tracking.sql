alter table inventory_items add column if not exists reorder_point integer not null default 0;
alter table sales add column if not exists last_due_alert_at timestamptz;
