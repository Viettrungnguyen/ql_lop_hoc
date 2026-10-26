"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

const uuid = z.string().uuid();

function go(path: string, type: "error" | "message", message: string): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

async function authenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return { supabase, user };
}

function optionalUuid(value: FormDataEntryValue | null) {
  return typeof value === "string" && value ? value : undefined;
}

export async function createClass(formData: FormData) {
  const schema = z.object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(2000).optional(),
    subjectId: z.string().uuid().optional(),
    gradeLevelId: z.string().uuid().optional(),
    academicYear: z.string().trim().max(20).optional(),
  });
  const parsed = schema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    subjectId: optionalUuid(formData.get("subjectId")),
    gradeLevelId: optionalUuid(formData.get("gradeLevelId")),
    academicYear: formData.get("academicYear") || undefined,
  });

  if (!parsed.success) {
    return go("/dashboard/classes", "error", "Thông tin lớp chưa hợp lệ.");
  }

  const { supabase } = await authenticatedClient();
  const { data, error } = await supabase.rpc("create_class", {
    p_name: parsed.data.name,
    p_description: parsed.data.description ?? null,
    p_subject_id: parsed.data.subjectId ?? null,
    p_grade_level_id: parsed.data.gradeLevelId ?? null,
    p_academic_year: parsed.data.academicYear ?? null,
    p_join_requires_approval: true,
  });

  if (error || !data?.[0]) {
    return go("/dashboard/classes", "error", "Không thể tạo lớp. Vui lòng thử lại.");
  }

  const created = data[0] as { class_id: string; join_code: string };
  redirect(
    `/dashboard/classes/${created.class_id}?message=${encodeURIComponent(
      `Đã tạo lớp. Mã tham gia: ${created.join_code}`,
    )}`,
  );
}

export async function joinClass(formData: FormData) {
  const parsed = z.string().trim().min(4).max(20).safeParse(formData.get("joinCode"));
  if (!parsed.success) {
    return go("/dashboard/classes", "error", "Mã lớp chưa hợp lệ.");
  }

  const { supabase } = await authenticatedClient();
  const { data, error } = await supabase.rpc("join_class_by_code", {
    p_join_code: parsed.data.toUpperCase(),
  });

  if (error || !data?.[0]) {
    return go("/dashboard/classes", "error", "Không tìm thấy lớp hoặc mã đã hết hiệu lực.");
  }

  const result = data[0] as { class_id: string; membership_status: "active" | "pending" };
  if (result.membership_status === "active") {
    redirect(`/dashboard/classes/${result.class_id}`);
  }

  go("/dashboard/classes", "message", "Đã gửi yêu cầu tham gia. Hãy chờ giáo viên duyệt.");
}

const classMutationSchema = z.object({
  classId: uuid,
});

async function prepareGroupTarget(
  supabase: SupabaseClient,
  classId: string,
  entityType: "post" | "event" | "lesson" | "resource",
  entityId: string,
  groupId?: string,
) {
  if (!groupId) return true;
  const { error } = await supabase.from("content_targets").insert({
    class_id: classId,
    entity_type: entityType,
    entity_id: entityId,
    target_type: "group",
    target_group_id: groupId,
  });
  return !error;
}

async function removePreparedTarget(supabase: SupabaseClient, entityType: string, entityId: string) {
  await supabase.from("content_targets").delete().eq("entity_type", entityType).eq("entity_id", entityId);
}

export async function createPost(formData: FormData) {
  const parsed = classMutationSchema
    .extend({
      title: z.string().trim().max(160).optional(),
      body: z.string().trim().min(1).max(10000),
      status: z.enum(["draft", "scheduled", "published"]),
      publishAt: z.string().optional(),
      groupId: z.string().uuid().optional(),
      resourceIds: z.array(uuid).max(10),
    })
    .safeParse({
      classId: formData.get("classId"),
      title: formData.get("title") || undefined,
      body: formData.get("body"),
      status: formData.get("status"),
      publishAt: formData.get("publishAt") || undefined,
      groupId: optionalUuid(formData.get("groupId")),
      resourceIds: formData.getAll("resourceIds"),
    });

  if (!parsed.success) {
    const fallbackClassId = uuid.safeParse(formData.get("classId"));
    if (fallbackClassId.success) {
      return go(`/dashboard/classes/${fallbackClassId.data}`, "error", "Thông tin bài đăng chưa hợp lệ hoặc có quá 10 tài liệu đính kèm.");
    }
    return;
  }
  const publishAt = parsed.data.status === "scheduled" && parsed.data.publishAt
    ? bangkokDate(parsed.data.publishAt)
    : undefined;
  if (parsed.data.status === "scheduled" && (!publishAt || !Number.isFinite(publishAt.getTime()) || publishAt <= new Date())) {
    return go(`/dashboard/classes/${parsed.data.classId}`, "error", "Thời gian hẹn đăng phải ở tương lai.");
  }
  const { supabase, user } = await authenticatedClient();
  const resourceIds = [...new Set(parsed.data.resourceIds)];
  if (resourceIds.length) {
    const { data: resources, error: resourceError } = await supabase
      .from("class_resources")
      .select("id")
      .eq("class_id", parsed.data.classId)
      .eq("status", "published")
      .is("deleted_at", null)
      .in("id", resourceIds);
    if (resourceError || resources?.length !== resourceIds.length) {
      return go(`/dashboard/classes/${parsed.data.classId}`, "error", "Có tài liệu đính kèm không hợp lệ.");
    }
  }
  const postId = crypto.randomUUID();
  const targetReady = await prepareGroupTarget(supabase, parsed.data.classId, "post", postId, parsed.data.groupId);
  if (!targetReady) return go(`/dashboard/classes/${parsed.data.classId}`, "error", "Nhóm nhận nội dung chưa hợp lệ.");
  const { error } = await supabase.from("posts").insert({
    id: postId,
    class_id: parsed.data.classId,
    author_id: user.id,
    title: parsed.data.title ?? null,
    body: parsed.data.body,
    status: "draft",
    publish_at: publishAt?.toISOString() ?? null,
  });

  const path = `/dashboard/classes/${parsed.data.classId}`;
  if (error) {
    await removePreparedTarget(supabase, "post", postId);
    return go(path, "error", "Không thể đăng thông báo.");
  }

  if (resourceIds.length) {
    const { error: attachmentError } = await supabase.from("post_attachments").insert(
      resourceIds.map((resourceId, position) => ({
        post_id: postId,
        resource_id: resourceId,
        position,
      })),
    );
    if (attachmentError) {
      await supabase.from("posts").update({ deleted_at: new Date().toISOString() }).eq("id", postId);
      await removePreparedTarget(supabase, "post", postId);
      return go(path, "error", "Không thể gắn tài liệu vào bài đăng.");
    }
  }

  if (parsed.data.status !== "draft") {
    const { error: publishError } = await supabase
      .from("posts")
      .update({ status: parsed.data.status })
      .eq("id", postId);
    if (publishError) {
      await supabase.from("posts").update({ deleted_at: new Date().toISOString() }).eq("id", postId);
      await removePreparedTarget(supabase, "post", postId);
      return go(path, "error", "Đã lưu nội dung nhưng không thể xuất bản bài đăng.");
    }
  }
  revalidatePath(path);
  const message = parsed.data.status === "draft"
    ? "Đã lưu bản nháp."
    : parsed.data.status === "scheduled"
      ? "Đã hẹn giờ đăng bài."
      : "Đã đăng lên bảng tin.";
  go(path, "message", message);
}

export async function togglePostPin(formData: FormData) {
  const parsed = classMutationSchema.extend({ postId: uuid, pinned: z.enum(["true", "false"]) }).safeParse({
    classId: formData.get("classId"),
    postId: formData.get("postId"),
    pinned: formData.get("pinned"),
  });
  if (!parsed.success) return;

  const { supabase } = await authenticatedClient();
  const path = `/dashboard/classes/${parsed.data.classId}`;
  const { error } = await supabase
    .from("posts")
    .update({ pinned_at: parsed.data.pinned === "true" ? null : new Date().toISOString() })
    .eq("id", parsed.data.postId)
    .eq("class_id", parsed.data.classId);
  if (error) return go(path, "error", "Không thể cập nhật trạng thái ghim.");
  revalidatePath(path);
}

export async function togglePostComments(formData: FormData) {
  const parsed = classMutationSchema.extend({ postId: uuid, locked: z.enum(["true", "false"]) }).safeParse({
    classId: formData.get("classId"),
    postId: formData.get("postId"),
    locked: formData.get("locked"),
  });
  if (!parsed.success) return;

  const { supabase } = await authenticatedClient();
  const path = `/dashboard/classes/${parsed.data.classId}`;
  const { error } = await supabase
    .from("posts")
    .update({ comments_locked: parsed.data.locked !== "true" })
    .eq("id", parsed.data.postId)
    .eq("class_id", parsed.data.classId);
  if (error) return go(path, "error", "Không thể cập nhật quyền bình luận.");
  revalidatePath(path);
}

export async function updatePost(formData: FormData) {
  const parsed = classMutationSchema.extend({
    postId: uuid,
    title: z.string().trim().max(160).optional(),
    body: z.string().trim().min(1).max(10000),
  }).safeParse({
    classId: formData.get("classId"),
    postId: formData.get("postId"),
    title: formData.get("title") || undefined,
    body: formData.get("body"),
  });
  if (!parsed.success) return;

  const { supabase } = await authenticatedClient();
  const path = `/dashboard/classes/${parsed.data.classId}`;
  const { error } = await supabase
    .from("posts")
    .update({
      title: parsed.data.title ?? null,
      body: parsed.data.body,
      edited_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.postId)
    .eq("class_id", parsed.data.classId)
    .neq("status", "archived");
  if (error) return go(path, "error", "Không thể cập nhật bài đăng.");
  revalidatePath(path);
  go(path, "message", "Đã cập nhật bài đăng.");
}

export async function archivePost(formData: FormData) {
  const parsed = classMutationSchema.extend({ postId: uuid }).safeParse({
    classId: formData.get("classId"),
    postId: formData.get("postId"),
  });
  if (!parsed.success) return;

  const { supabase } = await authenticatedClient();
  const path = `/dashboard/classes/${parsed.data.classId}`;
  const { error } = await supabase
    .from("posts")
    .update({ status: "archived" })
    .eq("id", parsed.data.postId)
    .eq("class_id", parsed.data.classId);
  if (error) return go(path, "error", "Không thể lưu trữ bài đăng.");
  revalidatePath(path);
  go(path, "message", "Đã lưu trữ bài đăng.");
}

export async function addComment(formData: FormData) {
  const parsed = classMutationSchema
    .extend({ postId: uuid, body: z.string().trim().min(1).max(2000) })
    .safeParse({
      classId: formData.get("classId"),
      postId: formData.get("postId"),
      body: formData.get("body"),
    });
  if (!parsed.success) return;

  const { supabase, user } = await authenticatedClient();
  const { error } = await supabase.from("post_comments").insert({
    post_id: parsed.data.postId,
    author_id: user.id,
    body: parsed.data.body,
  });
  const path = `/dashboard/classes/${parsed.data.classId}`;
  if (error) return go(path, "error", "Không thể gửi bình luận.");
  revalidatePath(path);
}

export async function deleteComment(formData: FormData) {
  const parsed = classMutationSchema.extend({ commentId: uuid }).safeParse({
    classId: formData.get("classId"),
    commentId: formData.get("commentId"),
  });
  if (!parsed.success) return;

  const { supabase } = await authenticatedClient();
  const path = `/dashboard/classes/${parsed.data.classId}`;
  const { error } = await supabase
    .from("post_comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.commentId);
  if (error) return go(path, "error", "Không thể xóa bình luận.");
  revalidatePath(path);
}

function bangkokDate(value: string) {
  const normalized = value.length === 16 ? `${value}:00+07:00` : `${value}+07:00`;
  return new Date(normalized);
}

export async function createEvent(formData: FormData) {
  const parsed = classMutationSchema
    .extend({
      title: z.string().trim().min(1).max(160),
      description: z.string().trim().max(5000).optional(),
      startsAt: z.string().min(16),
      endsAt: z.string().min(16),
      location: z.string().trim().max(300).optional(),
      meetingUrl: z.string().url().max(2000).optional(),
      groupId: z.string().uuid().optional(),
      repeatWeeks: z.coerce.number().int().min(1).max(20),
    })
    .safeParse({
      classId: formData.get("classId"),
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      startsAt: formData.get("startsAt"),
      endsAt: formData.get("endsAt"),
      location: formData.get("location") || undefined,
      meetingUrl: formData.get("meetingUrl") || undefined,
      groupId: optionalUuid(formData.get("groupId")),
      repeatWeeks: formData.get("repeatWeeks") || 1,
    });
  if (!parsed.success) return;

  const startsAt = bangkokDate(parsed.data.startsAt);
  const endsAt = bangkokDate(parsed.data.endsAt);
  const path = `/dashboard/classes/${parsed.data.classId}/calendar`;
  if (!Number.isFinite(startsAt.getTime()) || endsAt <= startsAt) {
    return go(path, "error", "Thời gian buổi học chưa hợp lệ.");
  }

  const { supabase, user } = await authenticatedClient();
  const eventIds = Array.from({ length: parsed.data.repeatWeeks }, () => crypto.randomUUID());
  if (parsed.data.groupId) {
    for (const eventId of eventIds) {
      const targetReady = await prepareGroupTarget(supabase, parsed.data.classId, "event", eventId, parsed.data.groupId);
      if (!targetReady) {
        await Promise.all(eventIds.map((id) => removePreparedTarget(supabase, "event", id)));
        return go(path, "error", "Nhóm nhận lịch chưa hợp lệ.");
      }
    }
  }
  const { error } = await supabase.from("schedule_events").insert(eventIds.map((eventId, index) => ({
    id: eventId,
    class_id: parsed.data.classId,
    created_by: user.id,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    starts_at: new Date(startsAt.getTime() + index * 7 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(endsAt.getTime() + index * 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: parsed.data.location ?? null,
    meeting_url: parsed.data.meetingUrl ?? null,
    recurrence_rule: parsed.data.repeatWeeks > 1 ? { frequency: "weekly", count: parsed.data.repeatWeeks, occurrence: index + 1 } : null,
    content_status: "published",
  })));

  if (error) {
    await Promise.all(eventIds.map((id) => removePreparedTarget(supabase, "event", id)));
    return go(path, "error", "Không thể tạo lịch học.");
  }
  revalidatePath(path);
  go(path, "message", parsed.data.repeatWeeks > 1 ? `Đã tạo ${parsed.data.repeatWeeks} buổi học hằng tuần.` : "Đã thêm lịch học.");
}

export async function cancelEvent(formData: FormData) {
  const parsed = classMutationSchema.extend({ eventId: uuid }).safeParse({
    classId: formData.get("classId"),
    eventId: formData.get("eventId"),
  });
  if (!parsed.success) return;

  const { supabase } = await authenticatedClient();
  const path = `/dashboard/classes/${parsed.data.classId}/calendar`;
  const { error } = await supabase
    .from("schedule_events")
    .update({ status: "cancelled" })
    .eq("id", parsed.data.eventId)
    .eq("class_id", parsed.data.classId);
  if (error) return go(path, "error", "Không thể hủy buổi học.");
  revalidatePath(path);
  go(path, "message", "Đã hủy buổi học.");
}

export async function updateEvent(formData: FormData) {
  const parsed = classMutationSchema.extend({
    eventId: uuid,
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(5000).optional(),
    startsAt: z.string().min(16),
    endsAt: z.string().min(16),
    location: z.string().trim().max(300).optional(),
    meetingUrl: z.string().url().max(2000).optional(),
  }).safeParse({
    classId: formData.get("classId"),
    eventId: formData.get("eventId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    location: formData.get("location") || undefined,
    meetingUrl: formData.get("meetingUrl") || undefined,
  });
  if (!parsed.success) return;

  const startsAt = bangkokDate(parsed.data.startsAt);
  const endsAt = bangkokDate(parsed.data.endsAt);
  const path = `/dashboard/classes/${parsed.data.classId}/calendar`;
  if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) {
    return go(path, "error", "Thời gian buổi học chưa hợp lệ.");
  }

  const { supabase } = await authenticatedClient();
  const { error } = await supabase
    .from("schedule_events")
    .update({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      location: parsed.data.location ?? null,
      meeting_url: parsed.data.meetingUrl ?? null,
    })
    .eq("id", parsed.data.eventId)
    .eq("class_id", parsed.data.classId)
    .eq("status", "active");
  if (error) return go(path, "error", "Không thể cập nhật buổi học.");
  revalidatePath(path);
  revalidatePath("/dashboard/calendar");
  go(path, "message", "Đã cập nhật buổi học.");
}

export async function createLessonModule(formData: FormData) {
  const parsed = classMutationSchema.extend({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(1000).optional(),
  }).safeParse({
    classId: formData.get("classId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return;

  const { supabase, user } = await authenticatedClient();
  const path = `/dashboard/classes/${parsed.data.classId}/lessons`;
  const { count } = await supabase
    .from("lesson_modules")
    .select("id", { count: "exact", head: true })
    .eq("class_id", parsed.data.classId)
    .is("deleted_at", null);
  const { error } = await supabase.from("lesson_modules").insert({
    class_id: parsed.data.classId,
    created_by: user.id,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    position: count ?? 0,
  });
  if (error) return go(path, "error", "Không thể tạo module bài giảng.");
  revalidatePath(path);
  go(path, "message", "Đã tạo module bài giảng.");
}

export async function createLesson(formData: FormData) {
  const parsed = classMutationSchema
    .extend({
      title: z.string().trim().min(1).max(200),
      summary: z.string().trim().max(1000).optional(),
      body: z.string().trim().max(50000),
      videoUrl: z.string().url().max(2000).optional(),
      moduleId: z.string().uuid().optional(),
      status: z.enum(["draft", "scheduled", "published"]),
      publishAt: z.string().optional(),
      groupId: z.string().uuid().optional(),
    })
    .safeParse({
      classId: formData.get("classId"),
      title: formData.get("title"),
      summary: formData.get("summary") || undefined,
      body: formData.get("body") || "",
      videoUrl: formData.get("videoUrl") || undefined,
      moduleId: optionalUuid(formData.get("moduleId")),
      status: formData.get("status"),
      publishAt: formData.get("publishAt") || undefined,
      groupId: optionalUuid(formData.get("groupId")),
    });
  if (!parsed.success) return;

  const path = `/dashboard/classes/${parsed.data.classId}/lessons`;
  const publishAt = parsed.data.status === "scheduled" && parsed.data.publishAt
    ? bangkokDate(parsed.data.publishAt)
    : undefined;
  if (parsed.data.status === "scheduled" && (!publishAt || !Number.isFinite(publishAt.getTime()) || publishAt <= new Date())) {
    return go(path, "error", "Thời gian xuất bản phải ở tương lai.");
  }

  const { supabase, user } = await authenticatedClient();
  if (parsed.data.moduleId) {
    const { count } = await supabase
      .from("lesson_modules")
      .select("id", { count: "exact", head: true })
      .eq("id", parsed.data.moduleId)
      .eq("class_id", parsed.data.classId)
      .is("deleted_at", null);
    if (!count) return go(path, "error", "Module bài giảng không hợp lệ.");
  }
  const lessonId = crypto.randomUUID();
  const targetReady = await prepareGroupTarget(supabase, parsed.data.classId, "lesson", lessonId, parsed.data.groupId);
  if (!targetReady) return go(`/dashboard/classes/${parsed.data.classId}/lessons`, "error", "Nhóm nhận bài giảng chưa hợp lệ.");
  const { error } = await supabase.from("lessons").insert({
    id: lessonId,
    class_id: parsed.data.classId,
    module_id: parsed.data.moduleId ?? null,
    created_by: user.id,
    title: parsed.data.title,
    summary: parsed.data.summary ?? null,
    body: parsed.data.body,
    video_url: parsed.data.videoUrl ?? null,
    status: parsed.data.status,
    publish_at: publishAt?.toISOString() ?? null,
  });
  if (error) {
    await removePreparedTarget(supabase, "lesson", lessonId);
    return go(path, "error", "Không thể tạo bài giảng.");
  }
  revalidatePath(path);
  const message = parsed.data.status === "draft"
    ? "Đã lưu bài giảng nháp."
    : parsed.data.status === "scheduled"
      ? "Đã hẹn giờ xuất bản bài giảng."
      : "Đã xuất bản bài giảng.";
  go(path, "message", message);
}

export async function markLessonComplete(formData: FormData) {
  const parsed = classMutationSchema.extend({ lessonId: uuid }).safeParse({
    classId: formData.get("classId"),
    lessonId: formData.get("lessonId"),
  });
  if (!parsed.success) return;

  const { supabase, user } = await authenticatedClient();
  await supabase.from("lesson_progress").upsert(
    {
      lesson_id: parsed.data.lessonId,
      user_id: user.id,
      status: "completed",
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    },
    { onConflict: "lesson_id,user_id" },
  );
  revalidatePath(`/dashboard/classes/${parsed.data.classId}/lessons`);
}

export async function createResourceLink(formData: FormData) {
  const parsed = classMutationSchema
    .extend({
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().max(2000).optional(),
      externalUrl: z.string().url().max(2000),
      groupId: z.string().uuid().optional(),
    })
    .safeParse({
      classId: formData.get("classId"),
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      externalUrl: formData.get("externalUrl"),
      groupId: optionalUuid(formData.get("groupId")),
    });
  if (!parsed.success) return;

  const { supabase, user } = await authenticatedClient();
  const resourceId = crypto.randomUUID();
  const targetReady = await prepareGroupTarget(supabase, parsed.data.classId, "resource", resourceId, parsed.data.groupId);
  if (!targetReady) return go(`/dashboard/classes/${parsed.data.classId}/resources`, "error", "Nhóm nhận tài liệu chưa hợp lệ.");
  const { error } = await supabase.from("class_resources").insert({
    id: resourceId,
    class_id: parsed.data.classId,
    created_by: user.id,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    kind: "link",
    external_url: parsed.data.externalUrl,
    status: "published",
  });
  const path = `/dashboard/classes/${parsed.data.classId}/resources`;
  if (error) {
    await removePreparedTarget(supabase, "resource", resourceId);
    return go(path, "error", "Không thể thêm tài liệu.");
  }
  revalidatePath(path);
  go(path, "message", "Đã thêm tài liệu vào lớp.");
}

export async function reviewMember(formData: FormData) {
  const parsed = classMutationSchema
    .extend({ memberId: uuid, status: z.enum(["active", "rejected", "removed"]) })
    .safeParse({
      classId: formData.get("classId"),
      memberId: formData.get("memberId"),
      status: formData.get("status"),
    });
  if (!parsed.success) return;

  const { supabase } = await authenticatedClient();
  const { error } = await supabase.rpc("review_class_member", {
    p_member_id: parsed.data.memberId,
    p_status: parsed.data.status,
  });
  const path = `/dashboard/classes/${parsed.data.classId}/members`;
  if (error) return go(path, "error", "Không thể cập nhật thành viên.");
  revalidatePath(path);
}

export async function createGroup(formData: FormData) {
  const parsed = classMutationSchema
    .extend({
      name: z.string().trim().min(1).max(80),
      memberIds: z.array(uuid).max(100),
    })
    .safeParse({
      classId: formData.get("classId"),
      name: formData.get("name"),
      memberIds: formData.getAll("memberIds"),
    });
  if (!parsed.success) return;

  const { supabase, user } = await authenticatedClient();
  const { data: group, error } = await supabase
    .from("groups")
    .insert({
      class_id: parsed.data.classId,
      name: parsed.data.name,
      created_by: user.id,
    })
    .select("id")
    .single();

  const path = `/dashboard/classes/${parsed.data.classId}/members`;
  if (error || !group) return go(path, "error", "Không thể tạo nhóm.");

  if (parsed.data.memberIds.length) {
    const { error: memberError } = await supabase.from("group_members").insert(
      parsed.data.memberIds.map((memberId) => ({
        group_id: group.id,
        class_member_id: memberId,
      })),
    );
    if (memberError) return go(path, "error", "Đã tạo nhóm nhưng chưa thể thêm thành viên.");
  }

  revalidatePath(path);
  go(path, "message", "Đã tạo nhóm học tập.");
}
