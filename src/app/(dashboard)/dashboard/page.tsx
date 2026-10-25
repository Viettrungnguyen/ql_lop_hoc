import { ArrowRight, BellRing, CalendarClock, CheckCircle2, ClipboardList, Plus, UsersRound } from "lucide-react";
import Link from "next/link";

import { StatusPill } from "@/components/status-pill";
import { createClient } from "@/lib/supabase/server";

type EventItem = { id: string; class_id: string; title: string; starts_at: string; ends_at: string };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const now = new Date().toISOString();
  const [{ data: memberships }, { data: events }, { count: unreadCount }] = await Promise.all([
    supabase.from("class_members").select("class_id,role").eq("user_id", user!.id).eq("status", "active"),
    supabase.from("schedule_events").select("id,class_id,title,starts_at,ends_at").gte("starts_at", now).eq("status", "active").order("starts_at").limit(5),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_id", user!.id).is("read_at", null),
  ]);
  const teacherClasses = (memberships ?? []).filter((member) => member.role !== "student").length;
  const studentClasses = (memberships ?? []).filter((member) => member.role === "student").length;
  const eventList = (events ?? []) as EventItem[];

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><StatusPill>{today()}</StatusPill><h1 className="font-display mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Một ngày dạy học nhẹ nhàng.</h1><p className="mt-3 text-slate-500">Lịch, thông báo và lớp học quan trọng nhất của bạn.</p></div>
        <Link href="/dashboard/classes" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#087f72] px-5 py-3.5 font-bold text-white"><Plus size={18} /> Mở lớp học</Link>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Summary icon={UsersRound} label="Lớp đang giảng dạy" value={teacherClasses} detail={`${studentClasses} lớp đang tham gia`} />
        <Summary icon={CalendarClock} label="Lịch sắp tới" value={eventList.length} detail="Trong các lớp của bạn" />
        <Summary icon={BellRing} label="Thông báo chưa đọc" value={unreadCount ?? 0} detail="Nội dung và lịch mới" />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.45fr_.75fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.15em] text-teal-700">Lịch sắp tới</p><h2 className="font-display mt-2 text-2xl font-bold text-slate-950">Các buổi học gần nhất</h2></div><CalendarClock className="text-slate-300" /></div>
          <div className="mt-6 space-y-3">{eventList.length ? eventList.map((event) => <Link className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-[#fafbf8] p-4 transition hover:border-teal-200" href={`/dashboard/classes/${event.class_id}/calendar`} key={event.id}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-50 text-sm font-black text-teal-800">{new Intl.DateTimeFormat("vi-VN", { day: "2-digit", timeZone: "Asia/Bangkok" }).format(new Date(event.starts_at))}</span><div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-900">{event.title}</p><p className="mt-1 text-xs text-slate-400">{formatDate(event.starts_at)}</p></div><ArrowRight className="text-slate-300" size={18} /></Link>) : <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-slate-300 bg-[#fafbf8] text-center"><div><CheckCircle2 className="mx-auto text-teal-600" size={30} /><p className="mt-3 font-bold text-slate-800">Chưa có lịch sắp tới</p><p className="mt-1 text-sm text-slate-500">Bạn có thể tạo lịch trong từng lớp.</p></div></div>}</div>
        </section>
        <aside className="rounded-3xl bg-[#102a2b] p-7 text-white shadow-xl shadow-slate-900/10"><ClipboardList className="text-[#d9f36b]" /><p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-teal-200">Tiến độ triển khai</p><h2 className="font-display mt-3 text-3xl font-bold">Tổ chức dạy học đã sẵn sàng.</h2><p className="mt-4 leading-7 text-slate-300">Bảng tin, lịch học, bài giảng, tài liệu, nhóm và thông báo đã được kết nối theo lớp.</p><div className="mt-8 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/2 rounded-full bg-[#d9f36b]" /></div><p className="mt-3 text-sm font-semibold text-slate-400">3 / 6 giai đoạn P0</p></aside>
      </div>
    </div>
  );
}

function Summary({ icon: Icon, label, value, detail }: { icon: typeof UsersRound; label: string; value: number; detail: string }) { return <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Icon size={21} /></span><ArrowRight className="text-slate-300" size={19} /></div><p className="mt-7 text-4xl font-black tracking-tight text-slate-950">{value}</p><p className="mt-2 font-bold text-slate-800">{label}</p><p className="mt-1 text-sm text-slate-400">{detail}</p></article>; }
function today() { return new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "long", timeZone: "Asia/Bangkok" }).format(new Date()); }
function formatDate(value: string) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(value)); }
