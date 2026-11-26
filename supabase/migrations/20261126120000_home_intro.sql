alter table public.site_settings
  add column if not exists home_intro text not null default '';
