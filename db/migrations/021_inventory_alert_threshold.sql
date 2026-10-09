alter table inventory_items add column if not exists reorder_threshold_type text not null default 'quantity';
alter table inventory_items add column if not exists reorder_threshold_value integer not null default 0;
update inventory_items set reorder_threshold_value = reorder_point where reorder_threshold_value = 0 and reorder_point > 0;
