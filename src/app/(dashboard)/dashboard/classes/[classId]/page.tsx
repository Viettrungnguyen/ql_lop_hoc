import { Archive, ExternalLink, FileText, Link2, Lock, LockOpen, MessageCircle, Paperclip, Pencil, Pin, Send, Sparkles, Trash2 } from "lucide-react";

import { AudienceSelect } from "@/components/classes/audience-select";
import { FlashMessage } from "@/components/flash-message";
import { addComment, archivePost, createPost, deleteComment, togglePostComments, togglePostPin, updatePost } from "@/features/classes/actions";
import { createClient } from "@/lib/supabase/server";

type Post = { id: string; author_id: string; title: string | null; body: string; status: string; publish_at: string | null; pinned_at: string | null; comments_locked: boolean; created_at: string; edited_at: string | null };
type Comment = { id: string; post_id: string; author_id: string; body: string; created_at: string };
type Attachment = { post_id: string; resource_id: string };
type Resource = { id: string; title: string; kind: "file" | "link"; storage_path: string | null; external_url: string | null; size_bytes: number | null; signedUrl?: string };

export default async function ClassFeedPage({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams: Promise<{ error?: string; message?: string }> }) {
  const [{ classId }, flash] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: membership }, { data: classroom }, { data: posts }, { data: groups }, { data: resources }] = await Promise.all([
    supabase.from("class_members").select("role,capabilities").eq("class_id", classId).eq("user_id", user!.id).eq("status", "active").single(),
    supabase.from("classes").select("allow_comments").eq("id", classId).single(),
    supabase.from("posts").select("id,author_id,title,body,status,publish_at,pinned_at,comments_locked,created_at,edited_at").eq("class_id", classId).order("pinned_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }),
    supabase.from("groups").select("id,name").eq("class_id", classId).is("deleted_at", null).order("name"),
    supabase.from("class_resources").select("id,title,kind,storage_path,external_url,size_bytes").eq("class_id", classId).eq("status", "published").is("deleted_at", null).order("created_at", { ascending: false }).limit(50),
  ]);
  const postList = (posts ?? []) as Post[];
  const postIds = postList.map((post) => post.id);
  const [{ data: comments }, { data: attachments }] = postIds.length
    ? await Promise.all([
        supabase.from("post_comments").select("id,post_id,author_id,body,created_at").in("post_id", postIds).order("created_at"),
        supabase.from("post_attachments").select("post_id,resource_id").in("post_id", postIds).order("position"),
      ])
    : [{ data: [] as Comment[] }, { data: [] as Attachment[] }];
  const commentList = (comments ?? []) as Comment[];
  const attachmentList = (attachments ?? []) as Attachment[];
  const resourceList = await Promise.all(((resources ?? []) as Resource[]).map(async (resource) => {
    if (resource.kind !== "file" || !resource.storage_path) return resource;
    const { data } = await supabase.storage.from("class-files").createSignedUrl(resource.storage_path, 600);
    return { ...resource, signedUrl: data?.signedUrl };
  }));
  const resourceById = new Map(resourceList.map((resource) => [resource.id, resource]));
  const authorIds = [...new Set([...postList.map((item) => item.author_id), ...commentList.map((item) => item.author_id)])];
  const { data: profiles } = authorIds.length
    ? await supabase.from("profiles").select("id,display_name").in("id", authorIds)
    : { data: [] as { id: string; display_name: string }[] };
  const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
  const manager = membership?.role === "owner" || membership?.role === "teacher" || Boolean(membership?.capabilities?.manage_content);

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:px-8 xl:grid-cols-[1fr_300px]">
      <section>
        <FlashMessage error={flash.error} message={flash.message} />
        {manager && (
          <form action={createPost} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <input name="classId" type="hidden" value={classId} />
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Send size={18} /></span><div><h2 className="font-black text-slate-950">Đăng lên bảng tin</h2><p className="text-xs text-slate-500">Chia sẻ thông báo và hướng dẫn cho cả lớp.</p></div></div>
            <input className="field mt-5" name="title" placeholder="Tiêu đề (không bắt buộc)" maxLength={160} />
            <textarea className="field mt-3 min-h-28 resize-y" name="body" placeholder="Nội dung thông báo..." required maxLength={10000} />
            <div className="mt-3"><AudienceSelect groups={groups ?? []} /></div>
            {resourceList.length > 0 && <details className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4"><summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-slate-700"><Paperclip size={16} /> Đính kèm tài liệu đã có</summary><p className="mt-2 text-xs text-slate-400">Chọn tối đa 10 tài liệu từ mục Tài liệu của lớp.</p><div className="mt-3 grid max-h-44 gap-2 overflow-y-auto sm:grid-cols-2">{resourceList.map((resource) => <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-slate-700" key={resource.id}><input className="h-4 w-4 accent-teal-700" name="resourceIds" type="checkbox" value={resource.id} />{resource.kind === "file" ? <FileText className="shrink-0 text-blue-600" size={16} /> : <Link2 className="shrink-0 text-teal-600" size={16} />}<span className="truncate">{resource.title}</span></label>)}</div></details>}
            <label className="mt-3 block"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Hẹn giờ đăng (khi cần)</span><input className="field" name="publishAt" type="datetime-local" /></label>
            <div className="mt-3 flex flex-wrap justify-end gap-2"><button className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600" name="status" value="draft">Lưu nháp</button><button className="rounded-xl border border-teal-700 px-4 py-2.5 text-sm font-bold text-teal-700" name="status" value="scheduled">Hẹn đăng</button><button className="rounded-xl bg-[#087f72] px-5 py-2.5 text-sm font-bold text-white" name="status" value="published">Đăng ngay</button></div>
          </form>
        )}

        <div className="mt-5 space-y-4">
          {postList.length ? postList.map((post) => {
            const postComments = commentList.filter((comment) => comment.post_id === post.id);
            const postResources = attachmentList.map((attachment) => attachment.post_id === post.id ? resourceById.get(attachment.resource_id) : undefined).filter((resource): resource is Resource => Boolean(resource));
            return (
              <article className="scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" id={`post-${post.id}`} key={post.id}>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#d9f36b] text-xs font-black">{(names.get(post.author_id) || "GV").slice(0, 2).toUpperCase()}</span><div><p className="font-bold text-slate-900">{names.get(post.author_id) || "Giáo viên"}</p><p className="text-xs text-slate-400">{formatDate(post.created_at)} · {postStatus(post)}{post.edited_at ? ` · Đã chỉnh sửa ${formatDate(post.edited_at)}` : ""}</p></div></div><div className="flex flex-wrap items-center gap-2">{manager && post.status !== "archived" && <><form action={togglePostPin}><input name="classId" type="hidden" value={classId} /><input name="postId" type="hidden" value={post.id} /><input name="pinned" type="hidden" value={String(Boolean(post.pinned_at))} /><button className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600"><Pin size={13} /> {post.pinned_at ? "Bỏ ghim" : "Ghim"}</button></form><form action={togglePostComments}><input name="classId" type="hidden" value={classId} /><input name="postId" type="hidden" value={post.id} /><input name="locked" type="hidden" value={String(post.comments_locked)} /><button className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">{post.comments_locked ? <LockOpen size={13} /> : <Lock size={13} />} {post.comments_locked ? "Mở bình luận" : "Khóa bình luận"}</button></form><form action={archivePost}><input name="classId" type="hidden" value={classId} /><input name="postId" type="hidden" value={post.id} /><button className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600"><Archive size={13} /> Lưu trữ</button></form></>}{post.pinned_at && !manager && <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700"><Pin size={13} /> Đã ghim</span>}</div></div>
                {post.title && <h2 className="mt-5 text-xl font-black text-slate-950">{post.title}</h2>}
                <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{post.body}</p>
                {postResources.length > 0 && <div className="mt-5 grid gap-2 sm:grid-cols-2">{postResources.map((resource) => { const href = resource.external_url || resource.signedUrl; const Icon = resource.kind === "file" ? FileText : Link2; return href ? <a className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-teal-200 hover:bg-teal-50" href={href} target="_blank" rel="noreferrer" key={resource.id}><Icon className="shrink-0 text-teal-700" size={18} /><span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">{resource.title}</span><ExternalLink className="shrink-0 text-slate-400" size={14} /></a> : null; })}</div>}
                {manager && post.status !== "archived" && <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4"><summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-teal-700"><Pencil size={15} /> Chỉnh sửa bài đăng</summary><form action={updatePost} className="mt-4 space-y-3"><input name="classId" type="hidden" value={classId} /><input name="postId" type="hidden" value={post.id} /><input className="field" name="title" defaultValue={post.title ?? ""} placeholder="Tiêu đề" maxLength={160} /><textarea className="field min-h-28" name="body" defaultValue={post.body} required maxLength={10000} /><button className="rounded-xl bg-[#087f72] px-5 py-2.5 text-sm font-bold text-white">Lưu nội dung</button></form></details>}
                <div className="mt-6 border-t border-slate-100 pt-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400"><MessageCircle size={15} /> {postComments.length} bình luận {post.comments_locked && <span className="ml-1 inline-flex items-center gap-1 text-amber-600"><Lock size={12} /> Đã khóa</span>}</p>
                  <div className="mt-3 space-y-3">{postComments.map((comment) => <div className="flex items-start gap-3 rounded-2xl bg-[#f6f7f3] px-4 py-3" key={comment.id}><div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-800">{names.get(comment.author_id) || "Thành viên"} <span className="ml-2 text-xs font-normal text-slate-400">{formatDate(comment.created_at)}</span></p><p className="mt-1 text-sm leading-6 text-slate-600">{comment.body}</p></div>{(manager || comment.author_id === user?.id) && <form action={deleteComment}><input name="classId" type="hidden" value={classId} /><input name="commentId" type="hidden" value={comment.id} /><button className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Xóa bình luận" aria-label="Xóa bình luận"><Trash2 size={14} /></button></form>}</div>)}</div>
                  {classroom?.allow_comments && !post.comments_locked && post.status === "published" && <form action={addComment} className="mt-3 flex gap-2"><input name="classId" type="hidden" value={classId} /><input name="postId" type="hidden" value={post.id} /><input className="field" name="body" placeholder="Viết bình luận..." required maxLength={2000} /><button className="grid w-12 shrink-0 place-items-center rounded-xl bg-slate-900 text-white" title="Gửi bình luận"><Send size={17} /></button></form>}
                </div>
              </article>
            );
          }) : <EmptyFeed />}
        </div>
      </section>

      <aside className="h-fit rounded-3xl bg-[#102a2b] p-6 text-white xl:sticky xl:top-28"><Sparkles className="text-[#d9f36b]" /><h2 className="font-display mt-5 text-2xl font-bold">Bảng tin của lớp</h2><p className="mt-3 text-sm leading-6 text-slate-300">Thông báo mới nhất, thay đổi lịch và nội dung học tập sẽ tập trung tại đây.</p></aside>
    </div>
  );
}

function EmptyFeed() {
  return <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white/60 p-8 text-center"><div><MessageCircle className="mx-auto text-slate-300" size={32} /><p className="mt-4 font-black text-slate-800">Bảng tin đang trống</p><p className="mt-2 text-sm text-slate-500">Thông báo đầu tiên của lớp sẽ xuất hiện tại đây.</p></div></div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(value));
}

function postStatus(post: Post) {
  if (post.status === "draft") return "Bản nháp";
  if (post.status === "scheduled" && post.publish_at) return `Hẹn đăng ${formatDate(post.publish_at)}`;
  if (post.status === "archived") return "Đã lưu trữ";
  return "Đã đăng";
}
