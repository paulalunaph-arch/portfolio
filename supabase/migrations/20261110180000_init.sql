-- Portfolio editorial de fotoperiodismo.
-- Ejecutar en el SQL Editor de Supabase (rol postgres) o con la CLI:
--   supabase db push
--
-- No habilita el registro público. El primer perfil nace con rol "pending".
-- El acceso de administración se otorga después, a mano, con el script
-- comentado al final de este archivo.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'pending' check (role in ('pending', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text check (description is null or char_length(description) <= 5000),
  year integer check (year is null or (year between 1900 and 2100)),
  location text check (location is null or char_length(location) <= 160),
  cover_image_url text,
  cover_photograph_id uuid,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.photographs (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.series (id) on delete cascade,
  image_url text,
  storage_path text not null,
  storage_bucket text not null default 'library' check (storage_bucket in ('portfolio', 'library')),
  caption text check (caption is null or char_length(caption) <= 1000),
  alt_text text check (alt_text is null or char_length(alt_text) <= 300),
  location text check (location is null or char_length(location) <= 160),
  taken_at date,
  sort_order integer not null default 0,
  home_selected boolean not null default false,
  home_sort_order integer not null default 0,
  published boolean not null default true,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  format text not null default 'webp',
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  original_file_size_bytes bigint check (original_file_size_bytes is null or original_file_size_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

alter table public.series
  drop constraint if exists series_cover_photograph_id_fkey;

alter table public.series
  add constraint series_cover_photograph_id_fkey
  foreign key (cover_photograph_id)
  references public.photographs (id)
  on delete set null
  deferrable initially deferred;

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  photographer_name text not null default 'Paula Luna',
  profession text not null default 'Fotoperiodismo / Fotografía documental',
  biography text not null default '',
  education text not null default '',
  interests text not null default '',
  author_statement text not null default '',
  portrait_url text,
  portrait_storage_path text,
  portrait_alt text not null default '',
  portrait_width integer,
  portrait_height integer,
  portrait_file_size_bytes bigint,
  featured_image_url text,
  featured_image_storage_path text,
  featured_image_alt text not null default '',
  featured_width integer,
  featured_height integer,
  featured_file_size_bytes bigint,
  email text not null default '',
  instagram text not null default '',
  social_links jsonb not null default '[]'::jsonb check (jsonb_typeof(social_links) = 'array'),
  seo_title text not null default '',
  seo_description text not null default '',
  updated_at timestamptz not null default now(),
  singleton boolean not null default true unique
);

insert into public.site_settings (photographer_name, profession, seo_title, seo_description)
select 'Paula Luna', 'Fotoperiodismo / Fotografía documental', 'Paula Luna', 'Fotoperiodismo y fotografía documental.'
where not exists (select 1 from public.site_settings);

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------

create index if not exists series_published_sort_idx
  on public.series (published, sort_order, title);

create index if not exists series_cover_photograph_idx
  on public.series (cover_photograph_id);

create index if not exists photographs_series_sort_idx
  on public.photographs (series_id, sort_order);

create index if not exists photographs_public_idx
  on public.photographs (series_id)
  where published;

create index if not exists photographs_home_idx
  on public.photographs (home_sort_order)
  where home_selected;

-- ---------------------------------------------------------------------------
-- Funciones
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'pending'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and coalesce(auth.role(), '') in ('anon', 'authenticated') then
    raise exception 'No está permitido modificar el rol desde la aplicación';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.reorder_series(p_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  expected integer;
  i integer;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  select count(*) into expected from public.series;

  if coalesce(array_length(p_ids, 1), 0) <> expected
     or (select count(distinct value) from unnest(p_ids) as value) <> expected then
    raise exception 'El orden debe incluir cada serie una sola vez';
  end if;

  for i in 1..expected loop
    update public.series
    set sort_order = i
    where id = p_ids[i];
  end loop;
end;
$$;

create or replace function public.reorder_photographs(p_series_id uuid, p_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  expected integer;
  i integer;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  select count(*) into expected
  from public.photographs
  where series_id = p_series_id;

  if coalesce(array_length(p_ids, 1), 0) <> expected
     or (select count(distinct value) from unnest(p_ids) as value) <> expected then
    raise exception 'El orden debe incluir cada fotografía de la serie una sola vez';
  end if;

  if exists (
    select 1
    from unnest(p_ids) as value
    where not exists (
      select 1
      from public.photographs
      where id = value
        and series_id = p_series_id
    )
  ) then
    raise exception 'Hay fotografías que no pertenecen a la serie';
  end if;

  for i in 1..expected loop
    update public.photographs
    set sort_order = i
    where id = p_ids[i]
      and series_id = p_series_id;
  end loop;
end;
$$;

create or replace function public.portfolio_storage_bytes()
returns bigint
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  total bigint;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  select coalesce(sum(file_size_bytes), 0) into total
  from public.photographs;

  total := total + coalesce((
    select coalesce(portrait_file_size_bytes, 0) + coalesce(featured_file_size_bytes, 0)
    from public.site_settings
    limit 1
  ), 0);

  return total;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

drop trigger if exists series_set_updated_at on public.series;
create trigger series_set_updated_at
  before update on public.series
  for each row execute function public.set_updated_at();

drop trigger if exists photographs_set_updated_at on public.photographs;
create trigger photographs_set_updated_at
  before update on public.photographs
  for each row execute function public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Permisos de tabla
-- ---------------------------------------------------------------------------

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;

revoke all on table public.series from anon, authenticated;
grant select on table public.series to anon, authenticated;
grant insert, update, delete on table public.series to authenticated;

revoke all on table public.photographs from anon, authenticated;
grant select on table public.photographs to anon, authenticated;
grant insert, update, delete on table public.photographs to authenticated;

revoke all on table public.site_settings from anon, authenticated;
grant select on table public.site_settings to anon, authenticated;
grant update on table public.site_settings to authenticated;

revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.protect_profile_role() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

revoke all on function public.reorder_series(uuid[]) from public, anon, authenticated;
grant execute on function public.reorder_series(uuid[]) to authenticated;

revoke all on function public.reorder_photographs(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.reorder_photographs(uuid, uuid[]) to authenticated;

revoke all on function public.portfolio_storage_bytes() from public, anon, authenticated;
grant execute on function public.portfolio_storage_bytes() to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.series enable row level security;
alter table public.photographs enable row level security;
alter table public.site_settings enable row level security;

alter table public.profiles force row level security;
alter table public.series force row level security;
alter table public.photographs force row level security;
alter table public.site_settings force row level security;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists series_public_read on public.series;
create policy series_public_read
  on public.series
  for select
  to anon, authenticated
  using (published = true);

drop policy if exists series_admin_read on public.series;
create policy series_admin_read
  on public.series
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists series_admin_insert on public.series;
create policy series_admin_insert
  on public.series
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists series_admin_update on public.series;
create policy series_admin_update
  on public.series
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists series_admin_delete on public.series;
create policy series_admin_delete
  on public.series
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists photographs_public_read on public.photographs;
create policy photographs_public_read
  on public.photographs
  for select
  to anon, authenticated
  using (
    published = true
    and exists (
      select 1
      from public.series
      where series.id = photographs.series_id
        and series.published = true
    )
  );

drop policy if exists photographs_admin_read on public.photographs;
create policy photographs_admin_read
  on public.photographs
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists photographs_admin_insert on public.photographs;
create policy photographs_admin_insert
  on public.photographs
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists photographs_admin_update on public.photographs;
create policy photographs_admin_update
  on public.photographs
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists photographs_admin_delete on public.photographs;
create policy photographs_admin_delete
  on public.photographs
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists site_settings_public_read on public.site_settings;
create policy site_settings_public_read
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists site_settings_admin_update on public.site_settings;
create policy site_settings_admin_update
  on public.site_settings
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage
-- portfolio: público, solo WebP ya publicado.
-- library: privado, WebP de borradores.
-- incoming: privado y temporario, archivo original que se borra al procesar.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('portfolio', 'portfolio', true, 5242880, array['image/webp']),
  ('library', 'library', false, 5242880, array['image/webp']),
  ('incoming', 'incoming', false, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'image/tiff'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists portfolio_public_read on storage.objects;
create policy portfolio_public_read
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'portfolio');

drop policy if exists portfolio_admin_insert on storage.objects;
create policy portfolio_admin_insert
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'portfolio' and public.is_admin());

drop policy if exists portfolio_admin_update on storage.objects;
create policy portfolio_admin_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'portfolio' and public.is_admin())
  with check (bucket_id = 'portfolio' and public.is_admin());

drop policy if exists portfolio_admin_delete on storage.objects;
create policy portfolio_admin_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'portfolio' and public.is_admin());

drop policy if exists library_admin_read on storage.objects;
create policy library_admin_read
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'library' and public.is_admin());

drop policy if exists library_admin_insert on storage.objects;
create policy library_admin_insert
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'library' and public.is_admin());

drop policy if exists library_admin_update on storage.objects;
create policy library_admin_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'library' and public.is_admin())
  with check (bucket_id = 'library' and public.is_admin());

drop policy if exists library_admin_delete on storage.objects;
create policy library_admin_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'library' and public.is_admin());

drop policy if exists incoming_admin_read on storage.objects;
create policy incoming_admin_read
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'incoming' and public.is_admin());

drop policy if exists incoming_admin_insert on storage.objects;
create policy incoming_admin_insert
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'incoming' and public.is_admin());

drop policy if exists incoming_admin_delete on storage.objects;
create policy incoming_admin_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'incoming' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Primer administrador
-- 1. En Authentication, desactivar el registro público.
-- 2. Authentication > Users > Add user. Marcar "Auto Confirm".
-- 3. Copiar el UUID del usuario y ejecutar:
--
-- update public.profiles
-- set role = 'admin',
--     full_name = 'Nombre de la fotógrafa'
-- where id = '00000000-0000-0000-0000-000000000000';
-- ---------------------------------------------------------------------------
