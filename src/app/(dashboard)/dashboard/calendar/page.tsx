import { CalendarDays, Clock3 } from "lucide-react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type Event = { id: string; class_id: string; title: string; starts_at: string; ends_at: string; location: string | null };

export default async function CalendarPage() {
  const supabase = await createClient();
  const [{ data: events }, { data: classes }] = await Promise.all([
    supabase.from("schedule_events").select("id,class_id,title,starts_at,ends_at,location").eq("status", "active").order("starts_at").limit(100),
    supabase.from("classes").select("id,name").eq("status", "active"),
  ]);
  const names = new Map((classes ?? []).map((item) => [item.id, item.name]));
  const items = (events ?? []) as Event[];

  return <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8"><p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">Tất cả lớp học</p><h1 className="font-display mt-3 text-5xl font-bold text-slate-950">Lịch dạy và học</h1><div className="mt-8 space-y-3">{items.length ? items.map((event) => <Link className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200" href={`/dashboard/classes/${event.class_id}/calendar`} key={event.id}><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-teal-50 text-lg font-black text-teal-800">{new Intl.DateTimeFormat("vi-VN", { day: "2-digit", timeZone: "Asia/Bangkok" }).format(new Date(event.starts_at))}</span><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-teal-700">{names.get(event.class_id) || "Lớp học"}</p><h2 className="mt-1 truncate font-black text-slate-950">{event.title}</h2><p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><Clock3 size={15} />{formatDate(event.starts_at)}</p></div></Link>) : <div className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white/50 text-center"><div><CalendarDays className="mx-auto text-slate-300" size={38} /><p className="mt-4 font-black text-slate-800">Chưa có lịch học</p></div></div>}</div></div>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(value)); }
