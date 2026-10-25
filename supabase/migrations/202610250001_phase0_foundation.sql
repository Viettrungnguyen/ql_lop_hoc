begin;

create extension if not exists pgcrypto;

create type public.platform_role as enum ('user', 'platform_admin');
create type public.onboarding_mode as enum ('teacher', 'student');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  avatar_path text,
  school_name text check (school_name is null or char_length(school_name) <= 160),
  province_code text check (province_code is null or char_length(province_code) <= 20),
  date_of_birth date,
  platform_role public.platform_role not null default 'user',
  onboarding_mode public.onboarding_mode not null default 'student',
  email_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public application profile linked one-to-one with auth.users.';
comment on column public.profiles.platform_role is 'Privileged field. Never writable by the authenticated client role.';

create table public.education_levels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  position smallint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.grade_levels (
  id uuid primary key default gen_random_uuid(),
  education_level_id uuid not null references public.education_levels(id) on delete restrict,
  code text not null unique,
  name text not null,
  position smallint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index grade_levels_education_level_idx
  on public.grade_levels (education_level_id, position);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  position smallint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.grade_subjects (
  grade_level_id uuid not null references public.grade_levels(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (grade_level_id, subject_id)
);

create index grade_subjects_subject_idx on public.grade_subjects (subject_id);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  class_id uuid,
  before_data jsonb,
  after_data jsonb,
  request_id text,
  created_at timestamptz not null default now()
);

create index audit_logs_actor_created_idx on public.audit_logs (actor_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_class_created_idx on public.audit_logs (class_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger education_levels_set_updated_at
before update on public.education_levels
for each row execute function public.set_updated_at();

create trigger grade_levels_set_updated_at
before update on public.grade_levels
for each row execute function public.set_updated_at();

create trigger subjects_set_updated_at
before update on public.subjects
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_mode public.onboarding_mode;
begin
  requested_mode := case
    when new.raw_user_meta_data ->> 'onboarding_mode' = 'teacher'
      then 'teacher'::public.onboarding_mode
    else 'student'::public.onboarding_mode
  end;

  insert into public.profiles (id, display_name, onboarding_mode)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(coalesce(new.email, 'nguoi-dung'), '@', 1)
    ),
    requested_mode
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.education_levels enable row level security;
alter table public.grade_levels enable row level security;
alter table public.subjects enable row level security;
alter table public.grade_subjects enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

revoke update on public.profiles from authenticated;
grant update (
  display_name,
  avatar_path,
  school_name,
  province_code,
  date_of_birth,
  onboarding_mode,
  email_notifications
) on public.profiles to authenticated;

create policy "education_levels_read_active"
on public.education_levels for select
to authenticated
using (active);

create policy "grade_levels_read_active"
on public.grade_levels for select
to authenticated
using (active);

create policy "subjects_read_active"
on public.subjects for select
to authenticated
using (active);

create policy "grade_subjects_read"
on public.grade_subjects for select
to authenticated
using (true);

revoke all on public.audit_logs from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('avatars', 'avatars', false, 5242880),
  ('class-files', 'class-files', false, 52428800),
  ('submissions', 'submissions', false, 104857600),
  ('material-files', 'material-files', false, 52428800)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

create policy "avatar_owner_read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "avatar_owner_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "avatar_owner_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "avatar_owner_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

commit;
