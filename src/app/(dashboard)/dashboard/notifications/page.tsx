import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";

import { markAllNotificationsRead } from "@/app/(dashboard)/actions";
import { createClient } from "@/lib/supabase/server";

type Notification = {
  id: string;
  class_id: string | null;
  type: string;
  title: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  read_at: string | null;
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id,class_id,type,title,entity_type,entity_id,created_at,read_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const items = (notifications ?? []) as Notification[];

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">Cập nhật mới</p>
          <h1 className="font-display mt-2 text-4xl font-bold text-slate-950">Thông báo</h1>
        </div>
        {items.some((item) => !item.read_at) && <form action={markAllNotificationsRead}><button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"><CheckCheck size={17} /> Đánh dấu đã đọc</button></form>}
      </div>
      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {items.length ? <div className="divide-y divide-slate-100">{items.map((item) => (
          <Link className={`flex items-start gap-4 p-5 transition hover:bg-slate-50 ${!item.read_at ? "bg-teal-50/50" : ""}`} href={notificationHref(item)} key={item.id}>
            <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-teal-700 shadow-sm"><Bell size={18} /></span>
            <div><p className="font-bold text-slate-900">{item.title}</p><p className="mt-1 text-xs text-slate-400">{label(item.entity_type)} · {formatDate(item.created_at)}</p></div>
            {!item.read_at && <span className="ml-auto mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#ff7a5c]" />}
          </Link>
        ))}</div> : <div className="grid min-h-72 place-items-center text-center"><div><Bell className="mx-auto text-slate-300" size={36} /><p className="mt-4 font-black text-slate-800">Chưa có thông báo</p></div></div>}
      </div>
    </div>
  );
}

function label(type: string | null) {
  return ({ post: "Bảng tin", event: "Lịch học", lesson: "Bài giảng", resource: "Tài liệu" } as Record<string, string>)[type ?? ""] ?? "Lớp học";
}

function notificationHref(item: Notification) {
  if (!item.class_id) return "/dashboard";
  const base = `/dashboard/classes/${item.class_id}`;
  if (item.entity_type === "event") return `${base}/calendar${item.entity_id ? `#event-${item.entity_id}` : ""}`;
  if (item.entity_type === "lesson") return `${base}/lessons`;
  if (item.entity_type === "resource") return `${base}/resources`;
  return `${base}${item.entity_id ? `#post-${item.entity_id}` : ""}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(value));
}
