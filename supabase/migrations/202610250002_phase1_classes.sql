begin;

create type public.class_status as enum ('active', 'archived', 'deleted');
create type public.class_member_role as enum ('owner', 'teacher', 'teaching_assistant', 'student');
create type public.class_member_status as enum ('pending', 'active', 'rejected', 'removed');

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 120),
  description text check (description is null or char_length(description) <= 2000),
  cover_path text,
  subject_id uuid references public.subjects(id) on delete set null,
  grade_level_id uuid references public.grade_levels(id) on delete set null,
  academic_year text check (academic_year is null or char_length(academic_year) <= 20),
  timezone text not null default 'Asia/Bangkok',
  join_code_hash text not null unique,
  join_code_hint text not null check (char_length(join_code_hint) = 2),
  join_requires_approval boolean not null default true,
  allow_comments boolean not null default true,
  show_member_list boolean not null default true,
  status public.class_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index classes_owner_status_idx on public.classes (owner_id, status);
create index classes_subject_idx on public.classes (subject_id);
create index classes_grade_level_idx on public.classes (grade_level_id);

create table public.class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.class_member_role not null default 'student',
  status public.class_member_status not null default 'pending',
  capabilities jsonb not null default '{}'::jsonb,
  joined_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, user_id)
);

create index class_members_user_status_idx on public.class_members (user_id, status);
create index class_members_class_role_status_idx on public.class_members (class_id, role, status);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text check (description is null or char_length(description) <= 500),
  color text not null default '#087f72' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  leader_member_id uuid references public.class_members(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index groups_class_idx on public.groups (class_id) where deleted_at is null;

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  class_member_id uuid not null references public.class_members(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, class_member_id)
);

create index group_members_class_member_idx on public.group_members (class_member_id);

create trigger classes_set_updated_at
before update on public.classes
for each row execute function public.set_updated_at();

create trigger class_members_set_updated_at
before update on public.class_members
for each row execute function public.set_updated_at();

create trigger groups_set_updated_at
before update on public.groups
for each row execute function public.set_updated_at();

create or replace function public.is_active_class_member(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_members
    where class_id = target_class_id
      and user_id = (select auth.uid())
      and status = 'active'
  );
$$;

create or replace function public.has_class_role(
  target_class_id uuid,
  allowed_roles public.class_member_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_members
    where class_id = target_class_id
      and user_id = (select auth.uid())
      and status = 'active'
      and role = any(allowed_roles)
  );
$$;

create or replace function public.has_class_capability(
  target_class_id uuid,
  capability_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_members
    where class_id = target_class_id
      and user_id = (select auth.uid())
      and status = 'active'
      and (
        role in ('owner', 'teacher')
        or coalesce((capabilities ->> capability_name)::boolean, false)
      )
  );
$$;

create or replace function public.shares_active_class(other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_members mine
    join public.class_members theirs on theirs.class_id = mine.class_id
    where mine.user_id = (select auth.uid())
      and mine.status = 'active'
      and theirs.user_id = other_user_id
      and (
        theirs.status = 'active'
        or (
          theirs.status = 'pending'
          and mine.role in ('owner', 'teacher')
        )
      )
  );
$$;

create or replace function public.is_active_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members gm
    join public.class_members cm on cm.id = gm.class_member_id
    where gm.group_id = target_group_id
      and cm.user_id = (select auth.uid())
      and cm.status = 'active'
  );
$$;

grant execute on function public.is_active_class_member(uuid) to authenticated;
grant execute on function public.has_class_role(uuid, public.class_member_role[]) to authenticated;
grant execute on function public.has_class_capability(uuid, text) to authenticated;
grant execute on function public.shares_active_class(uuid) to authenticated;
grant execute on function public.is_active_group_member(uuid) to authenticated;

create or replace function public.create_class(
  p_name text,
  p_description text default null,
  p_subject_id uuid default null,
  p_grade_level_id uuid default null,
  p_academic_year text default null,
  p_join_requires_approval boolean default true
)
returns table (class_id uuid, join_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  generated_code text;
  new_class_id uuid;
begin
  if actor_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if char_length(trim(p_name)) < 2 then
    raise exception 'CLASS_NAME_INVALID';
  end if;

  loop
    generated_code := upper(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 8));
    exit when not exists (
      select 1 from public.classes
      where join_code_hash = encode(extensions.digest(generated_code, 'sha256'), 'hex')
    );
  end loop;

  insert into public.classes (
    owner_id,
    name,
    description,
    subject_id,
    grade_level_id,
    academic_year,
    join_code_hash,
    join_code_hint,
    join_requires_approval
  )
  values (
    actor_id,
    trim(p_name),
    nullif(trim(p_description), ''),
    p_subject_id,
    p_grade_level_id,
    nullif(trim(p_academic_year), ''),
    encode(extensions.digest(generated_code, 'sha256'), 'hex'),
    right(generated_code, 2),
    p_join_requires_approval
  )
  returning id into new_class_id;

  insert into public.class_members (
    class_id, user_id, role, status, joined_at, reviewed_by
  )
  values (
    new_class_id, actor_id, 'owner', 'active', now(), actor_id
  );

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, class_id, after_data
  )
  values (
    actor_id,
    'class.created',
    'class',
    new_class_id,
    new_class_id,
    jsonb_build_object('name', trim(p_name))
  );

  return query select new_class_id, generated_code;
end;
$$;

create or replace function public.join_class_by_code(p_join_code text)
returns table (class_id uuid, membership_status public.class_member_status)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_class public.classes%rowtype;
  next_status public.class_member_status;
begin
  if actor_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into target_class
  from public.classes
  where join_code_hash = encode(
    extensions.digest(upper(trim(p_join_code)), 'sha256'),
    'hex'
  )
    and status = 'active';

  if target_class.id is null then
    raise exception 'CLASS_CODE_INVALID';
  end if;

  next_status := case
    when target_class.join_requires_approval then 'pending'::public.class_member_status
    else 'active'::public.class_member_status
  end;

  insert into public.class_members (
    class_id, user_id, role, status, joined_at
  )
  values (
    target_class.id,
    actor_id,
    'student',
    next_status,
    case when next_status = 'active' then now() else null end
  )
  on conflict on constraint class_members_class_id_user_id_key do update
  set status = case
        when public.class_members.status = 'active' then 'active'
        else excluded.status
      end,
      role = case
        when public.class_members.role in ('owner', 'teacher', 'teaching_assistant')
          then public.class_members.role
        else 'student'
      end,
      updated_at = now();

  select cm.status into next_status
  from public.class_members cm
  where cm.class_id = target_class.id
    and cm.user_id = actor_id;

  return query select target_class.id, next_status;
end;
$$;

create or replace function public.review_class_member(
  p_member_id uuid,
  p_status public.class_member_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_member public.class_members%rowtype;
begin
  select * into target_member
  from public.class_members
  where id = p_member_id;

  if target_member.id is null then
    raise exception 'MEMBER_NOT_FOUND';
  end if;

  if not public.has_class_role(
    target_member.class_id,
    array['owner', 'teacher']::public.class_member_role[]
  ) then
    raise exception 'CLASS_FORBIDDEN';
  end if;

  if target_member.role <> 'student' or p_status not in ('active', 'rejected', 'removed') then
    raise exception 'MEMBER_REVIEW_INVALID';
  end if;

  update public.class_members
  set status = p_status,
      joined_at = case when p_status = 'active' then coalesce(joined_at, now()) else joined_at end,
      reviewed_by = actor_id
  where id = p_member_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, class_id, after_data
  )
  values (
    actor_id,
    'class.member_reviewed',
    'class_member',
    p_member_id,
    target_member.class_id,
    jsonb_build_object('status', p_status)
  );
end;
$$;

create or replace function public.regenerate_class_join_code(p_class_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  generated_code text;
begin
  if not public.has_class_role(
    p_class_id,
    array['owner']::public.class_member_role[]
  ) then
    raise exception 'CLASS_FORBIDDEN';
  end if;

  generated_code := upper(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 8));

  update public.classes
  set join_code_hash = encode(extensions.digest(generated_code, 'sha256'), 'hex'),
      join_code_hint = right(generated_code, 2)
  where id = p_class_id;

  return generated_code;
end;
$$;

grant execute on function public.create_class(text, text, uuid, uuid, text, boolean) to authenticated;
grant execute on function public.join_class_by_code(text) to authenticated;
grant execute on function public.review_class_member(uuid, public.class_member_status) to authenticated;
grant execute on function public.regenerate_class_join_code(uuid) to authenticated;

alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

create policy "classes_select_members"
on public.classes for select to authenticated
using (public.is_active_class_member(id));

create policy "classes_update_managers"
on public.classes for update to authenticated
using (public.has_class_role(id, array['owner', 'teacher']::public.class_member_role[]))
with check (public.has_class_role(id, array['owner', 'teacher']::public.class_member_role[]));

revoke update on public.classes from authenticated;
grant update (
  name,
  description,
  cover_path,
  subject_id,
  grade_level_id,
  academic_year,
  timezone,
  join_requires_approval,
  allow_comments,
  show_member_list,
  status
) on public.classes to authenticated;

create policy "class_members_select_self_or_class"
on public.class_members for select to authenticated
using (
  user_id = (select auth.uid())
  or public.is_active_class_member(class_id)
);

create policy "groups_select_members"
on public.groups for select to authenticated
using (public.is_active_class_member(class_id));

create policy "groups_insert_managers"
on public.groups for insert to authenticated
with check (
  created_by = (select auth.uid())
  and public.has_class_role(class_id, array['owner', 'teacher']::public.class_member_role[])
);

create policy "groups_update_managers"
on public.groups for update to authenticated
using (public.has_class_role(class_id, array['owner', 'teacher']::public.class_member_role[]))
with check (public.has_class_role(class_id, array['owner', 'teacher']::public.class_member_role[]));

create policy "groups_delete_managers"
on public.groups for delete to authenticated
using (public.has_class_role(class_id, array['owner', 'teacher']::public.class_member_role[]));

create policy "group_members_select_class"
on public.group_members for select to authenticated
using (
  exists (
    select 1 from public.groups
    where groups.id = group_id
      and public.is_active_class_member(groups.class_id)
  )
);

create policy "group_members_insert_managers"
on public.group_members for insert to authenticated
with check (
  exists (
    select 1
    from public.groups
    join public.class_members on class_members.id = class_member_id
    where groups.id = group_id
      and groups.class_id = class_members.class_id
      and class_members.status = 'active'
      and public.has_class_role(
        groups.class_id,
        array['owner', 'teacher']::public.class_member_role[]
      )
  )
);

create policy "group_members_delete_managers"
on public.group_members for delete to authenticated
using (
  exists (
    select 1 from public.groups
    where groups.id = group_id
      and public.has_class_role(
        groups.class_id,
        array['owner', 'teacher']::public.class_member_role[]
      )
  )
);

create policy "profiles_select_shared_class"
on public.profiles for select to authenticated
using (public.shares_active_class(id));

commit;
