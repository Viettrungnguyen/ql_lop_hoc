import { CalendarClock, Clock3, MapPin, Pencil, Plus, Video } from "lucide-react";

import { AudienceSelect } from "@/components/classes/audience-select";
import { FlashMessage } from "@/components/flash-message";
import { cancelEvent, createEvent, updateEvent } from "@/features/classes/actions";
import { createClient } from "@/lib/supabase/server";

type EventItem = { id: string; title: string; description: string | null; starts_at: string; ends_at: string; location: string | null; meeting_url: string | null; status: string };

export default async function ClassCalendarPage({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams: Promise<{ error?: string; message?: string }> }) {
  const [{ classId }, flash] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: membership }, { data: events }, { data: groups }] = await Promise.all([
    supabase.from("class_members").select("role,capabilities").eq("class_id", classId).eq("user_id", user!.id).eq("status", "active").single(),
    supabase.from("schedule_events").select("id,title,description,starts_at,ends_at,location,meeting_url,status").eq("class_id", classId).order("starts_at"),
    supabase.from("groups").select("id,name").eq("class_id", classId).is("deleted_at", null).order("name"),
  ]);
  const manager = membership?.role === "owner" || membership?.role === "teacher" || Boolean(membership?.capabilities?.manage_schedule);
  const eventList = (events ?? []) as EventItem[];

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:px-8 xl:grid-cols-[1fr_380px]">
      <section>
        <FlashMessage error={flash.error} message={flash.message} />
        <div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Kế hoạch lớp</p><h2 className="font-display mt-2 text-3xl font-bold text-slate-950">Lịch học</h2></div><span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-500">{eventList.length} buổi</span></div>
        <div className="mt-6 space-y-3">
          {eventList.length ? eventList.map((event) => <article className="scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" id={`event-${event.id}`} key={event.id}>
            <div className="grid gap-4 sm:grid-cols-[100px_1fr_auto] sm:items-center">
              <div className="rounded-2xl bg-teal-50 p-3 text-center text-teal-800"><p className="text-xs font-bold uppercase">{month(event.starts_at)}</p><p className="mt-1 text-3xl font-black">{day(event.starts_at)}</p></div>
              <div><h3 className="text-lg font-black text-slate-950">{event.title}</h3><div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500"><span className="flex items-center gap-1.5"><Clock3 size={15} />{timeRange(event.starts_at, event.ends_at)}</span>{event.location && <span className="flex items-center gap-1.5"><MapPin size={15} />{event.location}</span>}</div>{event.description && <p className="mt-3 text-sm leading-6 text-slate-600">{event.description}</p>}</div>
              <div className="flex flex-col gap-2">{event.status === "cancelled" ? <span className="rounded-xl bg-rose-50 px-4 py-2.5 text-center text-sm font-bold text-rose-700">Đã hủy</span> : <>{event.meeting_url && <a className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#102a2b] px-4 py-2.5 text-sm font-bold text-white" href={event.meeting_url} target="_blank" rel="noreferrer"><Video size={16} /> Vào học</a>}{manager && <form action={cancelEvent}><input name="classId" type="hidden" value={classId} /><input name="eventId" type="hidden" value={event.id} /><button className="w-full rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-700">Hủy buổi học</button></form>}</>}</div>
            </div>
            {manager && event.status === "active" && <details className="mt-4 border-t border-slate-100 pt-4"><summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-teal-700"><Pencil size={15} /> Chỉnh sửa buổi học</summary><form action={updateEvent} className="mt-4 grid gap-3 md:grid-cols-2"><input name="classId" type="hidden" value={classId} /><input name="eventId" type="hidden" value={event.id} /><Field label="Tiêu đề"><input className="field" name="title" defaultValue={event.title} required maxLength={160} /></Field><Field label="Địa điểm"><input className="field" name="location" defaultValue={event.location ?? ""} maxLength={300} /></Field><Field label="Bắt đầu"><input className="field" name="startsAt" type="datetime-local" defaultValue={dateTimeInput(event.starts_at)} required /></Field><Field label="Kết thúc"><input className="field" name="endsAt" type="datetime-local" defaultValue={dateTimeInput(event.ends_at)} required /></Field><Field label="Link học online"><input className="field" name="meetingUrl" type="url" defaultValue={event.meeting_url ?? ""} placeholder="https://..." /></Field><div className="md:col-span-2"><Field label="Mô tả"><textarea className="field min-h-20" name="description" defaultValue={event.description ?? ""} maxLength={5000} /></Field></div><button className="rounded-xl bg-[#087f72] px-5 py-3 text-sm font-bold text-white md:col-span-2">Lưu thay đổi</button></form></details>}
          </article>) : <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white/60 text-center"><div><CalendarClock className="mx-auto text-slate-300" size={36} /><p className="mt-4 font-black text-slate-800">Chưa có lịch học</p><p className="mt-2 text-sm text-slate-500">Giáo viên có thể tạo buổi học ở biểu mẫu bên cạnh.</p></div></div>}
        </div>
      </section>

      {manager && <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-28"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Plus size={18} /></span><h2 className="font-black text-slate-950">Thêm buổi học</h2></div><form action={createEvent} className="mt-6 space-y-4"><input name="classId" type="hidden" value={classId} /><Field label="Tiêu đề"><input className="field" name="title" required maxLength={160} /></Field><Field label="Bắt đầu"><input className="field" name="startsAt" type="datetime-local" required /></Field><Field label="Kết thúc"><input className="field" name="endsAt" type="datetime-local" required /></Field><Field label="Lặp hằng tuần"><select className="field" name="repeatWeeks" defaultValue="1"><option value="1">Không lặp</option><option value="4">4 tuần</option><option value="8">8 tuần</option><option value="12">12 tuần</option></select></Field><Field label="Địa điểm"><input className="field" name="location" maxLength={300} /></Field><Field label="Link học online"><input className="field" name="meetingUrl" type="url" placeholder="https://..." /></Field><Field label="Mô tả"><textarea className="field min-h-20" name="description" maxLength={5000} /></Field><AudienceSelect groups={groups ?? []} /><button className="w-full rounded-2xl bg-[#087f72] px-5 py-3.5 font-bold text-white">Thêm vào lịch</button></form></aside>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>{children}</label>; }
function day(value: string) { return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", timeZone: "Asia/Bangkok" }).format(new Date(value)); }
function month(value: string) { return new Intl.DateTimeFormat("vi-VN", { month: "short", timeZone: "Asia/Bangkok" }).format(new Date(value)); }
function timeRange(start: string, end: string) { const formatter = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" }); return `${formatter.format(new Date(start))} – ${formatter.format(new Date(end))}`; }
function dateTimeInput(value: string) { return new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Bangkok" }).format(new Date(value)).replace(" ", "T"); }
