import { BookOpenText, CalendarDays, FileText, LayoutList, Settings, UsersRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function ClassroomLayout({ children, params }: { children: React.ReactNode; params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const supabase = await createClient();
  const { data: classroom } = await supabase.from("classes").select("id,name,description,academic_year").eq("id", classId).single();
  if (!classroom) notFound();

  const tabs = [
    [LayoutList, "Bảng tin", `/dashboard/classes/${classId}`],
    [CalendarDays, "Lịch học", `/dashboard/classes/${classId}/calendar`],
    [BookOpenText, "Bài giảng", `/dashboard/classes/${classId}/lessons`],
    [FileText, "Tài liệu", `/dashboard/classes/${classId}/resources`],
    [UsersRound, "Thành viên", `/dashboard/classes/${classId}/members`],
  ] as const;

  return (
    <div className="min-h-[calc(100vh-5rem)]">
      <div className="border-b border-slate-200 bg-white px-5 pt-7 sm:px-8"><div className="mx-auto max-w-7xl">
        <div className="flex items-start justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">{classroom.academic_year || "Lớp học đang hoạt động"}</p><h1 className="font-display mt-2 text-3xl font-bold text-slate-950">{classroom.name}</h1>{classroom.description && <p className="mt-2 max-w-2xl text-sm text-slate-500">{classroom.description}</p>}</div><button className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 text-slate-500" title="Cài đặt lớp" disabled><Settings size={18} /></button></div>
        <nav className="mt-7 flex gap-1 overflow-x-auto pb-3">{tabs.map(([Icon, label, href]) => <Link className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-teal-50 hover:text-teal-800" href={href} key={href}><Icon size={17} />{label}</Link>)}</nav>
      </div></div>
      {children}
    </div>
  );
}
