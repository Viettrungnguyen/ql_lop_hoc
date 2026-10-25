import { MessageCircle, Pin, Send, Sparkles } from "lucide-react";

import { AudienceSelect } from "@/components/classes/audience-select";
import { FlashMessage } from "@/components/flash-message";
import { addComment, createPost, togglePostPin } from "@/features/classes/actions";
import { createClient } from "@/lib/supabase/server";

type Post = { id: string; author_id: string; title: string | null; body: string; status: string; publish_at: string | null; pinned_at: string | null; created_at: string };
type Comment = { id: string; post_id: string; author_id: string; body: string; created_at: string };

export default async function ClassFeedPage({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams: Promise<{ error?: string; message?: string }> }) {
  const [{ classId }, flash] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: membership }, { data: classroom }, { data: posts }, { data: groups }] = await Promise.all([
    supabase.from("class_members").select("role,capabilities").eq("class_id", classId).eq("user_id", user!.id).eq("status", "active").single(),
    supabase.from("classes").select("allow_comments").eq("id", classId).single(),
    supabase.from("posts").select("id,author_id,title,body,status,publish_at,pinned_at,created_at").eq("class_id", classId).order("pinned_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }),
    supabase.from("groups").select("id,name").eq("class_id", classId).is("deleted_at", null).order("name"),
  ]);
  const postList = (posts ?? []) as Post[];
  const postIds = postList.map((post) => post.id);
  const { data: comments } = postIds.length
    ? await supabase.from("post_comments").select("id,post_id,author_id,body,created_at").in("post_id", postIds).order("created_at")
    : { data: [] as Comment[] };
  const commentList = (comments ?? []) as Comment[];
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
            <label className="mt-3 block"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Hẹn giờ đăng (khi cần)</span><input className="field" name="publishAt" type="datetime-local" /></label>
            <div className="mt-3 flex flex-wrap justify-end gap-2"><button className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600" name="status" value="draft">Lưu nháp</button><button className="rounded-xl border border-teal-700 px-4 py-2.5 text-sm font-bold text-teal-700" name="status" value="scheduled">Hẹn đăng</button><button className="rounded-xl bg-[#087f72] px-5 py-2.5 text-sm font-bold text-white" name="status" value="published">Đăng ngay</button></div>
          </form>
        )}

        <div className="mt-5 space-y-4">
          {postList.length ? postList.map((post) => {
            const postComments = commentList.filter((comment) => comment.post_id === post.id);
            return (
              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" key={post.id}>
                <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#d9f36b] text-xs font-black">{(names.get(post.author_id) || "GV").slice(0, 2).toUpperCase()}</span><div><p className="font-bold text-slate-900">{names.get(post.author_id) || "Giáo viên"}</p><p className="text-xs text-slate-400">{formatDate(post.created_at)} · {postStatus(post)}</p></div></div><div className="flex items-center gap-2">{manager && <form action={togglePostPin}><input name="classId" type="hidden" value={classId} /><input name="postId" type="hidden" value={post.id} /><input name="pinned" type="hidden" value={String(Boolean(post.pinned_at))} /><button className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600"><Pin size={13} /> {post.pinned_at ? "Bỏ ghim" : "Ghim"}</button></form>}{post.pinned_at && !manager && <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700"><Pin size={13} /> Đã ghim</span>}</div></div>
                {post.title && <h2 className="mt-5 text-xl font-black text-slate-950">{post.title}</h2>}
                <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{post.body}</p>
                <div className="mt-6 border-t border-slate-100 pt-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400"><MessageCircle size={15} /> {postComments.length} bình luận</p>
                  <div className="mt-3 space-y-3">{postComments.map((comment) => <div className="rounded-2xl bg-[#f6f7f3] px-4 py-3" key={comment.id}><p className="text-sm font-bold text-slate-800">{names.get(comment.author_id) || "Thành viên"} <span className="ml-2 text-xs font-normal text-slate-400">{formatDate(comment.created_at)}</span></p><p className="mt-1 text-sm leading-6 text-slate-600">{comment.body}</p></div>)}</div>
                  {classroom?.allow_comments && post.status === "published" && <form action={addComment} className="mt-3 flex gap-2"><input name="classId" type="hidden" value={classId} /><input name="postId" type="hidden" value={post.id} /><input className="field" name="body" placeholder="Viết bình luận..." required maxLength={2000} /><button className="grid w-12 shrink-0 place-items-center rounded-xl bg-slate-900 text-white" title="Gửi bình luận"><Send size={17} /></button></form>}
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
  return "Đã đăng";
}
