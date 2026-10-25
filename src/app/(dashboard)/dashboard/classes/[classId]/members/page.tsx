import { Check, Clock3, ShieldCheck, UserRoundPlus, UsersRound, X } from "lucide-react";

import { FlashMessage } from "@/components/flash-message";
import { createGroup, reviewMember } from "@/features/classes/actions";
import { createClient } from "@/lib/supabase/server";

type Member = { id: string; user_id: string; role: string; status: string; joined_at: string | null };
type Profile = { id: string; display_name: string };
type Group = { id: string; name: string; color: string };

export default async function MembersPage({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams: Promise<{ error?: string; message?: string }> }) {
  const [{ classId }, flash] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: membership }, { data: members }, { data: groups }] = await Promise.all([
    supabase.from("class_members").select("role,capabilities").eq("class_id", classId).eq("user_id", user!.id).eq("status", "active").single(),
    supabase.from("class_members").select("id,user_id,role,status,joined_at").eq("class_id", classId).order("created_at"),
    supabase.from("groups").select("id,name,color").eq("class_id", classId).is("deleted_at", null).order("created_at"),
  ]);
  const memberList = (members ?? []) as Member[];
  const userIds = memberList.map((member) => member.user_id);
  const { data: profiles } = userIds.length ? await supabase.from("profiles").select("id,display_name").in("id", userIds) : { data: [] as Profile[] };
  const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
  const manager = membership?.role === "owner" || membership?.role === "teacher" || Boolean(membership?.capabilities?.manage_members);
  const pending = memberList.filter((member) => member.status === "pending");
  const active = memberList.filter((member) => member.status === "active");
  const students = active.filter((member) => member.role === "student");

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:px-8 xl:grid-cols-[1fr_380px]">
      <section><FlashMessage error={flash.error} message={flash.message} /><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Cộng đồng lớp</p><h2 className="font-display mt-2 text-3xl font-bold text-slate-950">Thành viên</h2></div><span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-500">{active.length} đang hoạt động</span></div>
        {manager && pending.length > 0 && <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-center gap-2 font-black text-amber-900"><Clock3 size={18} /> {pending.length} yêu cầu đang chờ</div><div className="mt-4 space-y-2">{pending.map((member) => <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 sm:flex-row sm:items-center sm:justify-between" key={member.id}><div><p className="font-bold text-slate-900">{names.get(member.user_id) || "Học sinh"}</p><p className="text-xs text-slate-400">Đang chờ duyệt vào lớp</p></div><div className="flex gap-2"><form action={reviewMember}><input name="classId" type="hidden" value={classId} /><input name="memberId" type="hidden" value={member.id} /><button className="inline-flex items-center gap-1 rounded-xl bg-teal-700 px-3 py-2 text-xs font-bold text-white" name="status" value="active"><Check size={14} /> Duyệt</button></form><form action={reviewMember}><input name="classId" type="hidden" value={classId} /><input name="memberId" type="hidden" value={member.id} /><button className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600" name="status" value="rejected"><X size={14} /> Từ chối</button></form></div></div>)}</div></div>}
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4 text-sm font-black text-slate-900">Danh sách lớp</div><div className="divide-y divide-slate-100">{active.map((member) => <div className="flex items-center gap-4 px-5 py-4" key={member.id}><span className="grid h-10 w-10 place-items-center rounded-full bg-[#eef4ed] text-xs font-black text-teal-800">{(names.get(member.user_id) || "TV").slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-900">{names.get(member.user_id) || "Thành viên"}</p><p className="mt-0.5 text-xs text-slate-400">{roleName(member.role)}</p></div>{member.role !== "student" && <ShieldCheck className="text-teal-700" size={18} />}</div>)}</div></div>
      </section>
      <aside className="h-fit space-y-5 xl:sticky xl:top-28"><div className="rounded-3xl bg-[#102a2b] p-6 text-white"><UsersRound className="text-[#d9f36b]" /><h2 className="font-display mt-5 text-2xl font-bold">Nhóm học tập</h2><div className="mt-5 space-y-2">{(groups as Group[] | null)?.length ? (groups as Group[]).map((group) => <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3" key={group.id}><span className="h-3 w-3 rounded-full" style={{ backgroundColor: group.color }} /><span className="text-sm font-bold">{group.name}</span></div>) : <p className="text-sm leading-6 text-slate-300">Chưa có nhóm. Chia lớp thành nhóm để giao nội dung riêng ở các bước tiếp theo.</p>}</div></div>
        {manager && <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><UserRoundPlus className="text-teal-700" size={20} /><h2 className="font-black text-slate-950">Tạo nhóm</h2></div><form action={createGroup} className="mt-5"><input name="classId" type="hidden" value={classId} /><input className="field" name="name" placeholder="Tên nhóm" required maxLength={80} /><fieldset className="mt-4"><legend className="text-xs font-bold uppercase tracking-wide text-slate-500">Chọn học sinh</legend><div className="mt-2 max-h-48 space-y-1 overflow-y-auto">{students.map((student) => <label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50" key={student.id}><input className="h-4 w-4 accent-teal-700" name="memberIds" type="checkbox" value={student.id} /><span className="text-sm font-semibold text-slate-700">{names.get(student.user_id) || "Học sinh"}</span></label>)}</div></fieldset><button className="mt-4 w-full rounded-xl bg-[#087f72] px-4 py-3 text-sm font-bold text-white">Tạo nhóm học tập</button></form></div>}
      </aside>
    </div>
  );
}

function roleName(role: string) { return ({ owner: "Chủ lớp", teacher: "Giáo viên", teaching_assistant: "Trợ giảng", student: "Học sinh" } as Record<string, string>)[role] ?? role; }
