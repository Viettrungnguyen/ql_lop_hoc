begin;

alter table public.posts
add column edited_at timestamptz;

grant update (edited_at) on public.posts to authenticated;

create table public.post_attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  resource_id uuid not null references public.class_resources(id) on delete restrict,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique (post_id, resource_id)
);

create index post_attachments_post_position_idx
on public.post_attachments (post_id, position, created_at);

create or replace function public.enforce_post_attachment_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*)
    from public.post_attachments
    where post_attachments.post_id = new.post_id
  ) >= 10 then
    raise exception 'POST_ATTACHMENT_LIMIT_EXCEEDED';
  end if;

  return new;
end;
$$;

create trigger post_attachments_enforce_limit
before insert on public.post_attachments
for each row execute function public.enforce_post_attachment_limit();

alter table public.post_attachments enable row level security;

create policy "post_attachments_select_visible"
on public.post_attachments for select to authenticated
using (
  exists (
    select 1
    from public.posts p
    join public.class_resources r on r.id = resource_id
    where p.id = post_id
      and r.class_id = p.class_id
      and p.deleted_at is null
      and r.deleted_at is null
      and (
        public.can_manage_class_content(p.class_id)
        or (
          p.status = 'published'
          and (p.publish_at is null or p.publish_at <= now())
          and r.status = 'published'
          and (r.publish_at is null or r.publish_at <= now())
          and public.can_view_content_target(p.class_id, 'post', p.id)
          and public.can_view_content_target(r.class_id, 'resource', r.id)
        )
      )
  )
);

create policy "post_attachments_insert_managers"
on public.post_attachments for insert to authenticated
with check (
  exists (
    select 1
    from public.posts p
    join public.class_resources r on r.id = resource_id
    where p.id = post_id
      and r.class_id = p.class_id
      and p.deleted_at is null
      and r.deleted_at is null
      and public.can_manage_class_content(p.class_id)
  )
);

create policy "post_attachments_delete_managers"
on public.post_attachments for delete to authenticated
using (
  exists (
    select 1
    from public.posts p
    where p.id = post_id
      and public.can_manage_class_content(p.class_id)
  )
);

revoke update on public.post_attachments from authenticated;

create policy "post_comments_update_managers"
on public.post_comments for update to authenticated
using (
  exists (
    select 1
    from public.posts p
    where p.id = post_id
      and public.can_manage_class_content(p.class_id)
  )
)
with check (
  exists (
    select 1
    from public.posts p
    where p.id = post_id
      and public.can_manage_class_content(p.class_id)
  )
);

revoke update on public.post_comments from authenticated;
grant update (body, deleted_at) on public.post_comments to authenticated;

create or replace function public.notify_on_event_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  notification_type text;
  notification_title text;
begin
  if row(
    old.title, old.description, old.starts_at, old.ends_at,
    old.location, old.meeting_url, old.status
  ) is not distinct from row(
    new.title, new.description, new.starts_at, new.ends_at,
    new.location, new.meeting_url, new.status
  ) then
    return new;
  end if;

  notification_type := case when new.status = 'cancelled' then 'event.cancelled' else 'event.updated' end;
  notification_title := case
    when new.status = 'cancelled' then 'Đã hủy: ' || new.title
    else 'Lịch học thay đổi: ' || new.title
  end;

  insert into public.notifications (
    recipient_id, class_id, type, title, entity_type, entity_id
  )
  select distinct
    cm.user_id,
    new.class_id,
    notification_type,
    notification_title,
    'event',
    new.id
  from public.class_members cm
  where cm.class_id = new.class_id
    and cm.status = 'active'
    and cm.user_id <> actor_id
    and exists (
      select 1
      from public.content_targets ct
      where ct.class_id = new.class_id
        and ct.entity_type = 'event'
        and ct.entity_id = new.id
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

create trigger events_notify_changed
after update of title, description, starts_at, ends_at, location, meeting_url, status
on public.schedule_events
for each row execute function public.notify_on_event_change();

commit;
