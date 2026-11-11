alter table public.site_settings
  add column if not exists color_background text not null default '#040302',
  add column if not exists color_text text not null default '#f5f4ef',
  add column if not exists color_muted text not null default '#a8a39b',
  add column if not exists color_line text not null default '#161412';

alter table public.site_settings
  drop constraint if exists site_settings_colors_hex;

alter table public.site_settings
  add constraint site_settings_colors_hex check (
    color_background ~ '^#[0-9a-fA-F]{6}$'
    and color_text ~ '^#[0-9a-fA-F]{6}$'
    and color_muted ~ '^#[0-9a-fA-F]{6}$'
    and color_line ~ '^#[0-9a-fA-F]{6}$'
  );
