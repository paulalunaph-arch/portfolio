alter table public.photographs
  add column if not exists home_selected boolean not null default false,
  add column if not exists home_sort_order integer not null default 0;

create index if not exists photographs_home_idx
  on public.photographs (home_sort_order)
  where home_selected;
