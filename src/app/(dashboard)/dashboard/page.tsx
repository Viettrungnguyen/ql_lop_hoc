import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Plus,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { StatusPill } from "@/components/status-pill";

const summary = [
  ["Lớp đang hoạt động", "0", UsersRound, "Bắt đầu ở giai đoạn 1"],
  ["Bài cần chấm", "0", ClipboardList, "Chưa có bài nộp"],
  ["Lịch hôm nay", "0", CalendarClock, "Chưa có lịch học"],
] as const;

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <StatusPill>Chủ nhật, 25 tháng 10</StatusPill>
          <h1 className="font-display mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Một ngày dạy học nhẹ nhàng.
          </h1>
          <p className="mt-3 text-slate-500">Nền tảng đã sẵn sàng để tạo lớp học đầu tiên.</p>
        </div>
        <button disabled className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-[#087f72] px-5 py-3.5 font-bold text-white opacity-55" title="Mở ở giai đoạn 1">
          <Plus size={18} /> Tạo lớp học
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {summary.map(([label, value, Icon, detail], index) => (
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" key={label}>
            <div className="flex items-center justify-between">
              <span className={`grid h-11 w-11 place-items-center rounded-2xl ${index === 1 ? "bg-orange-50 text-[#dd5d40]" : "bg-teal-50 text-teal-700"}`}>
                <Icon size={21} />
              </span>
              <ArrowUpRight className="text-slate-300" size={19} />
            </div>
            <p className="mt-7 text-4xl font-black tracking-tight text-slate-950">{value}</p>
            <p className="mt-2 font-bold text-slate-800">{label}</p>
            <p className="mt-1 text-sm text-slate-400">{detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.45fr_.75fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.15em] text-teal-700">Việc cần làm</p>
              <h2 className="font-display mt-2 text-2xl font-bold text-slate-950">Hôm nay của bạn</h2>
            </div>
            <Clock3 className="text-slate-300" />
          </div>
          <div className="mt-8 grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-[#fafbf8] px-6 text-center">
            <div className="max-w-sm">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e5f4ef] text-teal-700">
                <CheckCircle2 size={27} />
              </span>
              <p className="mt-5 font-bold text-slate-900">Chưa có nhiệm vụ nào</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Khi lớp học được tạo, lịch dạy, bài cần chấm và yêu cầu tham gia sẽ xuất hiện tại đây.
              </p>
            </div>
          </div>
        </section>

        <aside className="overflow-hidden rounded-3xl bg-[#102a2b] p-7 text-white shadow-xl shadow-slate-900/10">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d9f36b] text-[#102a2b]">
            <Sparkles size={23} />
          </span>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-teal-200">Bước tiếp theo</p>
          <h2 className="font-display mt-3 text-3xl font-bold">Tạo lớp và mời học sinh.</h2>
          <p className="mt-4 leading-7 text-slate-300">
            Giai đoạn 1 sẽ mở luồng tạo lớp, mã tham gia, duyệt thành viên, vai trò và nhóm học tập.
          </p>
          <div className="mt-8 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/6 rounded-full bg-[#d9f36b]" />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-400">1 / 6 giai đoạn P0</p>
        </aside>
      </div>
    </div>
  );
}
