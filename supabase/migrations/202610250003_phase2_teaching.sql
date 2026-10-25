begin;

create type public.content_status as enum ('draft', 'scheduled', 'published', 'archived');
create type public.content_target_type as enum ('class', 'group');
create type public.class_event_status as enum ('active', 'cancelled');
create type public.resource_kind as enum ('file', 'link');
create type public.lesson_progress_status as enum ('not_started', 'in_progress', 'completed');

create table public.content_targets (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  entity_type text not null check (entity_type in ('post', 'event', 'lesson', 'resource')),
  entity_id uuid not null,
  target_type public.content_target_type not null default 'class',
  target_group_id uuid references public.groups(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (
    (target_type = 'class' and target_group_id is null)
    or (target_type = 'group' and target_group_id is not null)
  ),
  unique (entity_type, entity_id, target_type, target_group_id)
);

create index content_targets_entity_idx on public.content_targets (entity_type, entity_id);
create index content_targets_group_idx on public.content_targets (target_group_id) where target_group_id is not null;

create or replace function public.validate_content_target_group()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.target_type = 'group' and not exists (
    select 1
    from public.groups
    where groups.id = new.target_group_id
      and groups.class_id = new.class_id
      and groups.deleted_at is null
  ) then
    raise exception 'CONTENT_TARGET_GROUP_INVALID';
  end if;

  return new;
end;
$$;

create trigger content_targets_validate_group
before insert or update on public.content_targets
for each row execute function public.validate_content_target_group();

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text check (title is null or char_length(title) <= 160),
  body text not null check (char_length(body) between 1 and 10000),
  status public.content_status not null default 'published',
  publish_at timestamptz,
  pinned_at timestamptz,
  comments_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (status <> 'scheduled' or publish_at is not null)
);

create index posts_class_feed_idx on public.posts (class_id, pinned_at desc, created_at desc)
where deleted_at is null;

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index post_comments_post_idx on public.post_comments (post_id, created_at)
where deleted_at is null;

create table public.schedule_events (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 160),
  description text check (description is null or char_length(description) <= 5000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text check (location is null or char_length(location) <= 300),
  meeting_url text check (meeting_url is null or char_length(meeting_url) <= 2000),
  recurrence_rule jsonb,
  status public.class_event_status not null default 'active',
  content_status public.content_status not null default 'published',
  publish_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (content_status <> 'scheduled' or publish_at is not null)
);

create index schedule_events_class_start_idx on public.schedule_events (class_id, starts_at);

create table public.lesson_modules (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text check (description is null or char_length(description) <= 1000),
  position integer not null default 0,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index lesson_modules_class_position_idx on public.lesson_modules (class_id, position)
where deleted_at is null;

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  module_id uuid references public.lesson_modules(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 200),
  summary text check (summary is null or char_length(summary) <= 1000),
  body text not null default '' check (char_length(body) <= 50000),
  video_url text check (video_url is null or char_length(video_url) <= 2000),
  position integer not null default 0,
  status public.content_status not null default 'draft',
  publish_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (status <> 'scheduled' or publish_at is not null)
);

create index lessons_class_module_position_idx on public.lessons (class_id, module_id, position)
where deleted_at is null;

create or replace function public.validate_lesson_module()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.module_id is not null and not exists (
    select 1
    from public.lesson_modules
    where lesson_modules.id = new.module_id
      and lesson_modules.class_id = new.class_id
      and lesson_modules.deleted_at is null
  ) then
    raise exception 'LESSON_MODULE_INVALID';
  end if;

  return new;
end;
$$;

create trigger lessons_validate_module
before insert or update of module_id, class_id on public.lessons
for each row execute function public.validate_lesson_module();

create table public.lesson_progress (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.lesson_progress_status not null default 'not_started',
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (lesson_id, user_id)
);

create index lesson_progress_user_idx on public.lesson_progress (user_id, status);

create table public.class_resources (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 200),
  description text check (description is null or char_length(description) <= 2000),
  kind public.resource_kind not null,
  storage_path text,
  external_url text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  status public.content_status not null default 'published',
  publish_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (
    (kind = 'file' and storage_path is not null and external_url is null)
    or (kind = 'link' and external_url is not null and storage_path is null)
  ),
  check (status <> 'scheduled' or publish_at is not null)
);

create index class_resources_class_created_idx on public.class_resources (class_id, created_at desc)
where deleted_at is null;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  type text not null,
  title text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notifications_recipient_unread_idx on public.notifications (recipient_id, created_at desc)
where read_at is null;

create trigger posts_set_updated_at before update on public.posts
for each row execute function public.set_updated_at();
create trigger post_comments_set_updated_at before update on public.post_comments
for each row execute function public.set_updated_at();
create trigger schedule_events_set_updated_at before update on public.schedule_events
for each row execute function public.set_updated_at();
create trigger lesson_modules_set_updated_at before update on public.lesson_modules
for each row execute function public.set_updated_at();
create trigger lessons_set_updated_at before update on public.lessons
for each row execute function public.set_updated_at();
create trigger lesson_progress_set_updated_at before update on public.lesson_progress
for each row execute function public.set_updated_at();
create trigger class_resources_set_updated_at before update on public.class_resources
for each row execute function public.set_updated_at();

create or replace function public.can_manage_class_content(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_class_role(
    target_class_id,
    array['owner', 'teacher']::public.class_member_role[]
  ) or public.has_class_capability(target_class_id, 'manage_content');
$$;

create or replace function public.can_manage_class_schedule(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_class_role(
    target_class_id,
    array['owner', 'teacher']::public.class_member_role[]
  ) or public.has_class_capability(target_class_id, 'manage_schedule');
$$;

create or replace function public.can_view_content_target(
  target_class_id uuid,
  target_entity_type text,
  target_entity_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.can_manage_class_content(target_class_id)
    or (
      public.is_active_class_member(target_class_id)
      and exists (
        select 1
        from public.content_targets ct
        where ct.class_id = target_class_id
          and ct.entity_type = target_entity_type
          and ct.entity_id = target_entity_id
          and (
            ct.target_type = 'class'
            or (
              ct.target_type = 'group'
              and public.is_active_group_member(ct.target_group_id)
            )
          )
      )
    );
$$;

grant execute on function public.can_manage_class_content(uuid) to authenticated;
grant execute on function public.can_manage_class_schedule(uuid) to authenticated;
grant execute on function public.can_view_content_target(uuid, text, uuid) to authenticated;

create or replace function public.add_default_class_target()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  record_data jsonb := to_jsonb(new);
  content_type text := tg_argv[0];
begin
  if not exists (
    select 1 from public.content_targets
    where entity_type = content_type
      and entity_id = (record_data ->> 'id')::uuid
  ) then
    insert into public.content_targets (
      class_id, entity_type, entity_id, target_type
    )
    values (
      (record_data ->> 'class_id')::uuid,
      content_type,
      (record_data ->> 'id')::uuid,
      'class'
    );
  end if;
  return new;
end;
$$;

create trigger posts_default_target after insert on public.posts
for each row execute function public.add_default_class_target('post');
create trigger events_default_target after insert on public.schedule_events
for each row execute function public.add_default_class_target('event');
create trigger lessons_default_target after insert on public.lessons
for each row execute function public.add_default_class_target('lesson');
create trigger resources_default_target after insert on public.class_resources
for each row execute function public.add_default_class_target('resource');

create or replace function public.notify_on_published_content()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  record_data jsonb := to_jsonb(new);
  previous_data jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  target_class_id uuid := (record_data ->> 'class_id')::uuid;
  target_entity_id uuid := (record_data ->> 'id')::uuid;
  actor_id uuid := coalesce(
    (record_data ->> 'author_id')::uuid,
    (record_data ->> 'created_by')::uuid
  );
  published_status text := coalesce(record_data ->> 'content_status', record_data ->> 'status');
  previous_status text := coalesce(previous_data ->> 'content_status', previous_data ->> 'status');
  notification_title text := coalesce(record_data ->> 'title', 'Nội dung mới');
  entity_name text := tg_argv[0];
begin
  if published_status <> 'published' then
    return new;
  end if;

  if tg_op = 'UPDATE' and previous_status = 'published' then
    return new;
  end if;

  insert into public.notifications (
    recipient_id, class_id, type, title, entity_type, entity_id
  )
  select distinct
    cm.user_id,
    target_class_id,
    entity_name || '.published',
    notification_title,
    entity_name,
    target_entity_id
  from public.class_members cm
  where cm.class_id = target_class_id
    and cm.status = 'active'
    and cm.user_id <> actor_id
    and exists (
      select 1
      from public.content_targets ct
      where ct.class_id = target_class_id
        and ct.entity_type = entity_name
        and ct.entity_id = target_entity_id
        and (
          ct.target_type = 'class'
          or exists (
            select 1
            from public.group_members gm
            where gm.group_id = ct.target_group_id
              and gm.class_member_id = cm.id
          )
        )
    );

  return new;
end;
$$;

create trigger posts_notify_published after insert or update of status on public.posts
for each row execute function public.notify_on_published_content('post');
create trigger events_notify_published after insert or update of content_status on public.schedule_events
for each row execute function public.notify_on_published_content('event');
create trigger lessons_notify_published after insert or update of status on public.lessons
for each row execute function public.notify_on_published_content('lesson');
create trigger resources_notify_published after insert or update of status on public.class_resources
for each row execute function public.notify_on_published_content('resource');

create or replace function public.publish_due_teaching_content()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_count integer := 0;
  current_count integer;
begin
  update public.posts
  set status = 'published'
  where status = 'scheduled'
    and publish_at <= now()
    and deleted_at is null;
  get diagnostics current_count = row_count;
  affected_count := affected_count + current_count;

  update public.lessons
  set status = 'published'
  where status = 'scheduled'
    and publish_at <= now()
    and deleted_at is null;
  get diagnostics current_count = row_count;
  affected_count := affected_count + current_count;

  update public.class_resources
  set status = 'published'
  where status = 'scheduled'
    and publish_at <= now()
    and deleted_at is null;
  get diagnostics current_count = row_count;
  affected_count := affected_count + current_count;

  update public.schedule_events
  set content_status = 'published'
  where content_status = 'scheduled'
    and publish_at <= now();
  get diagnostics current_count = row_count;
  affected_count := affected_count + current_count;

  return affected_count;
end;
$$;

grant execute on function public.publish_due_teaching_content() to authenticated;

alter table public.content_targets enable row level security;
alter table public.posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.schedule_events enable row level security;
alter table public.lesson_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.class_resources enable row level security;
alter table public.notifications enable row level security;

create policy "content_targets_select_members" on public.content_targets
for select to authenticated using (public.is_active_class_member(class_id));
create policy "content_targets_manage_managers" on public.content_targets
for all to authenticated
using (
  public.can_manage_class_content(class_id)
  or (entity_type = 'event' and public.can_manage_class_schedule(class_id))
)
with check (
  public.can_manage_class_content(class_id)
  or (entity_type = 'event' and public.can_manage_class_schedule(class_id))
);

create policy "posts_select_visible" on public.posts
for select to authenticated using (
  deleted_at is null
  and (
    public.can_manage_class_content(class_id)
    or (
      status = 'published'
      and (publish_at is null or publish_at <= now())
      and public.can_view_content_target(class_id, 'post', id)
    )
  )
);
create policy "posts_insert_managers" on public.posts
for insert to authenticated with check (
  author_id = (select auth.uid()) and public.can_manage_class_content(class_id)
);
create policy "posts_update_managers" on public.posts
for update to authenticated
using (public.can_manage_class_content(class_id))
with check (public.can_manage_class_content(class_id));

revoke update on public.posts from authenticated;
grant update (title, body, status, publish_at, pinned_at, comments_locked, deleted_at)
on public.posts to authenticated;

create policy "post_comments_select_visible" on public.post_comments
for select to authenticated using (
  deleted_at is null
  and exists (
    select 1 from public.posts
    where posts.id = post_id
      and (
        public.can_manage_class_content(posts.class_id)
        or (
          posts.status = 'published'
          and public.can_view_content_target(posts.class_id, 'post', posts.id)
        )
      )
  )
);
create policy "post_comments_insert_members" on public.post_comments
for insert to authenticated with check (
  author_id = (select auth.uid())
  and exists (
    select 1 from public.posts
    where posts.id = post_id
      and posts.comments_locked = false
      and public.is_active_class_member(posts.class_id)
      and public.can_view_content_target(posts.class_id, 'post', posts.id)
  )
);
create policy "post_comments_update_own" on public.post_comments
for update to authenticated
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()));

create policy "events_select_visible" on public.schedule_events
for select to authenticated using (
  public.can_manage_class_content(class_id)
  or (
    content_status = 'published'
    and (publish_at is null or publish_at <= now())
    and public.can_view_content_target(class_id, 'event', id)
  )
);
create policy "events_insert_managers" on public.schedule_events
for insert to authenticated with check (
  created_by = (select auth.uid()) and public.can_manage_class_schedule(class_id)
);
create policy "events_update_managers" on public.schedule_events
for update to authenticated
using (public.can_manage_class_schedule(class_id))
with check (public.can_manage_class_schedule(class_id));
create policy "events_delete_managers" on public.schedule_events
for delete to authenticated using (public.can_manage_class_schedule(class_id));

revoke update on public.schedule_events from authenticated;
grant update (
  title, description, starts_at, ends_at, location, meeting_url,
  recurrence_rule, status, content_status, publish_at
) on public.schedule_events to authenticated;

create policy "lesson_modules_select_members" on public.lesson_modules
for select to authenticated using (deleted_at is null and public.is_active_class_member(class_id));
create policy "lesson_modules_insert_managers" on public.lesson_modules
for insert to authenticated with check (
  created_by = (select auth.uid()) and public.can_manage_class_content(class_id)
);
create policy "lesson_modules_update_managers" on public.lesson_modules
for update to authenticated
using (public.can_manage_class_content(class_id))
with check (public.can_manage_class_content(class_id));
create policy "lesson_modules_delete_managers" on public.lesson_modules
for delete to authenticated using (public.can_manage_class_content(class_id));

revoke update on public.lesson_modules from authenticated;
grant update (title, description, position, deleted_at)
on public.lesson_modules to authenticated;

create policy "lessons_select_visible" on public.lessons
for select to authenticated using (
  deleted_at is null
  and (
    public.can_manage_class_content(class_id)
    or (
      status = 'published'
      and (publish_at is null or publish_at <= now())
      and public.can_view_content_target(class_id, 'lesson', id)
    )
  )
);
create policy "lessons_insert_managers" on public.lessons
for insert to authenticated with check (
  created_by = (select auth.uid()) and public.can_manage_class_content(class_id)
);
create policy "lessons_update_managers" on public.lessons
for update to authenticated
using (public.can_manage_class_content(class_id))
with check (public.can_manage_class_content(class_id));
create policy "lessons_delete_managers" on public.lessons
for delete to authenticated using (public.can_manage_class_content(class_id));

revoke update on public.lessons from authenticated;
grant update (module_id, title, summary, body, video_url, position, status, publish_at, deleted_at)
on public.lessons to authenticated;

create policy "lesson_progress_select_own_or_manager" on public.lesson_progress
for select to authenticated using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.lessons
    where lessons.id = lesson_id
      and public.can_manage_class_content(lessons.class_id)
  )
);
create policy "lesson_progress_insert_own" on public.lesson_progress
for insert to authenticated with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.lessons
    where lessons.id = lesson_id
      and public.can_view_content_target(lessons.class_id, 'lesson', lessons.id)
  )
);
create policy "lesson_progress_update_own" on public.lesson_progress
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "resources_select_visible" on public.class_resources
for select to authenticated using (
  deleted_at is null
  and (
    public.can_manage_class_content(class_id)
    or (
      status = 'published'
      and (publish_at is null or publish_at <= now())
      and public.can_view_content_target(class_id, 'resource', id)
    )
  )
);
create policy "resources_insert_managers" on public.class_resources
for insert to authenticated with check (
  created_by = (select auth.uid()) and public.can_manage_class_content(class_id)
);
create policy "resources_update_managers" on public.class_resources
for update to authenticated
using (public.can_manage_class_content(class_id))
with check (public.can_manage_class_content(class_id));
create policy "resources_delete_managers" on public.class_resources
for delete to authenticated using (public.can_manage_class_content(class_id));

revoke update on public.class_resources from authenticated;
grant update (title, description, status, publish_at, deleted_at)
on public.class_resources to authenticated;

create policy "notifications_select_own" on public.notifications
for select to authenticated using (recipient_id = (select auth.uid()));
create policy "notifications_update_own" on public.notifications
for update to authenticated
using (recipient_id = (select auth.uid()))
with check (recipient_id = (select auth.uid()));
revoke insert, delete on public.notifications from authenticated;
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

create or replace function public.can_access_class_file(object_name text, require_manage boolean default false)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_class_id uuid;
  target_resource_id uuid;
begin
  target_class_id := split_part(object_name, '/', 1)::uuid;
  if require_manage then
    return public.can_manage_class_content(target_class_id);
  end if;

  if split_part(object_name, '/', 2) = 'resources' then
    target_resource_id := split_part(object_name, '/', 3)::uuid;
    return exists (
      select 1
      from public.class_resources
      where class_resources.id = target_resource_id
        and class_resources.class_id = target_class_id
        and class_resources.kind = 'file'
        and class_resources.storage_path = object_name
        and class_resources.deleted_at is null
        and public.can_view_content_target(target_class_id, 'resource', target_resource_id)
    );
  end if;

  return false;
exception when invalid_text_representation then
  return false;
end;
$$;

grant execute on function public.can_access_class_file(text, boolean) to authenticated;

create policy "class_files_read_members" on storage.objects
for select to authenticated using (
  bucket_id = 'class-files'
  and public.can_access_class_file(name, false)
);
create policy "class_files_insert_managers" on storage.objects
for insert to authenticated with check (
  bucket_id = 'class-files'
  and public.can_access_class_file(name, true)
);
create policy "class_files_update_managers" on storage.objects
for update to authenticated
using (bucket_id = 'class-files' and public.can_access_class_file(name, true))
with check (bucket_id = 'class-files' and public.can_access_class_file(name, true));
create policy "class_files_delete_managers" on storage.objects
for delete to authenticated using (
  bucket_id = 'class-files'
  and public.can_access_class_file(name, true)
);

commit;
