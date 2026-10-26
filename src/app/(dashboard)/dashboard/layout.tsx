import {
  Bell,
  ChevronDown,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/(dashboard)/actions";
import { BrandMark } from "@/components/brand-mark";
import { DashboardNavigation, MobileDashboardMenu } from "@/components/dashboard/dashboard-navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase.rpc("publish_due_teaching_content");

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  const name =
    (user.user_metadata.display_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Người dùng";

  return (
    <main className="min-h-screen bg-[#f4f6f1] lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-slate-200 bg-white px-5 py-6 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <BrandMark className="px-2" />
        <div className="mt-10"><DashboardNavigation /></div>
        <div className="mt-auto rounded-2xl bg-[#102a2b] p-4 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-[#d9f36b]">Giai đoạn 2</p>
          <p className="mt-2 text-sm font-bold">Tổ chức dạy học</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            Lớp học, lịch, bài giảng và tài liệu đã sẵn sàng.
          </p>
        </div>
      </aside>

      <section className="min-w-0">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-[#f4f6f1]/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <MobileDashboardMenu />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Không gian cá nhân</p>
              <p className="hidden text-sm font-semibold text-slate-500 sm:block">Theo dõi việc dạy và học trong ngày</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/dashboard/notifications" className="relative grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600" aria-label="Thông báo">
              <Bell size={19} />
              {Boolean(unreadCount) && <span className="absolute right-1.5 top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#ff7a5c] px-1 text-[9px] font-black text-white">{(unreadCount ?? 0) > 9 ? "9+" : unreadCount}</span>}
            </Link>
            <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white py-1.5 pl-2 pr-3 sm:flex">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#d9f36b] text-xs font-black text-[#102a2b]">
                {name.slice(0, 2).toUpperCase()}
              </span>
              <span className="max-w-28 truncate text-sm font-bold text-slate-800">{name}</span>
              <ChevronDown className="text-slate-400" size={15} />
            </div>
            <form action={signOut}>
              <button className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:text-red-600" title="Đăng xuất" aria-label="Đăng xuất">
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
