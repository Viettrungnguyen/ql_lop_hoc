import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FolderTree,
  Sparkles,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { StatusPill } from "@/components/status-pill";

const features = [
  {
    icon: UsersRound,
    title: "Lớp học có tổ chức",
    description:
      "Thành viên, vai trò và nhóm học tập nằm trong một không gian thống nhất.",
  },
  {
    icon: ClipboardCheck,
    title: "Giao và chấm bài",
    description:
      "Từ bài tự luận đến trắc nghiệm, theo dõi được từng lượt nộp và phản hồi.",
  },
  {
    icon: FolderTree,
    title: "Học liệu dùng lại",
    description:
      "Sắp xếp theo cấp, khối, môn và tái sử dụng trong nhiều lớp mà không nhân bản file.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8f2]">
      <div className="page-grid relative">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-[#d9f36b]/30 blur-3xl" />
        <div className="absolute -right-24 top-48 h-80 w-80 rounded-full bg-[#65cfc3]/20 blur-3xl" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
          <BrandMark />
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a className="transition hover:text-teal-800" href="#tinh-nang">
              Tính năng
            </a>
            <a className="transition hover:text-teal-800" href="#quy-trinh">
              Quy trình
            </a>
            <a className="transition hover:text-teal-800" href="#hoc-lieu">
              Học liệu
            </a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              className="soft-ring rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-white sm:px-4"
              href="/login"
            >
              Đăng nhập
            </Link>
            <Link
              className="soft-ring rounded-xl bg-[#087f72] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:bg-[#075b55]"
              href="/register"
            >
              Bắt đầu
            </Link>
          </div>
        </header>

        <section className="relative z-10 mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-14 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:pb-32 lg:pt-24">
          <div className="animate-float-in flex flex-col items-start">
            <StatusPill>Được thiết kế cho việc dạy thật</StatusPill>
            <h1 className="font-display text-balance mt-7 max-w-3xl text-5xl font-black leading-[1.02] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl">
              Dạy học gọn gàng.
              <span className="relative ml-3 inline-block text-[#087f72]">
                Tiến bộ rõ ràng.
                <svg
                  className="absolute -bottom-3 left-0 h-4 w-full text-[#ff7a5c]"
                  viewBox="0 0 400 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 13C104 3 281 4 396 9"
                    stroke="currentColor"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p className="mt-9 max-w-xl text-lg leading-8 text-slate-600">
              Một không gian đủ tập trung để giáo viên tổ chức lớp, chia sẻ bài
              giảng, giao bài và nhìn thấy học sinh đang cần hỗ trợ ở đâu.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                className="soft-ring inline-flex items-center justify-center gap-2 rounded-2xl bg-[#102a2b] px-6 py-4 font-bold text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-[#193c3d]"
                href="/register"
              >
                Tạo lớp đầu tiên <ArrowRight size={18} />
              </Link>
              <Link
                className="soft-ring inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 font-bold text-slate-800 transition hover:bg-white"
                href="/login"
              >
                Tham gia lớp học
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600">
              {["Không quảng cáo", "Dữ liệu lớp riêng tư", "Dùng tốt trên điện thoại"].map(
                (item) => (
                  <span className="flex items-center gap-2" key={item}>
                    <CheckCircle2 className="text-teal-700" size={17} /> {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:ml-auto">
            <div className="absolute -left-7 top-24 z-20 hidden rotate-[-7deg] rounded-2xl bg-[#ff7a5c] px-5 py-4 text-sm font-bold text-white shadow-xl sm:block">
              18/22 học sinh đã nộp
            </div>
            <div className="paper-card relative rotate-[1.5deg] rounded-[2rem] p-3 sm:p-5">
              <div className="overflow-hidden rounded-[1.45rem] border border-slate-200 bg-[#fbfcf8]">
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
                      Lớp 10A2 · Toán học
                    </p>
                    <p className="mt-1 font-bold text-slate-900">Tổng quan hôm nay</p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#d9f36b] text-sm font-black">
                    TV
                  </span>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#102a2b] p-5 text-white sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-teal-100">
                        Buổi học kế tiếp
                      </span>
                      <CalendarDays size={18} />
                    </div>
                    <p className="mt-6 font-display text-2xl font-bold">Hàm số bậc hai</p>
                    <p className="mt-2 text-sm text-slate-300">14:00 · Phòng 204 · 45 phút</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <Sparkles className="text-[#ff7a5c]" size={20} />
                    <p className="mt-4 text-3xl font-black text-slate-950">82%</p>
                    <p className="mt-1 text-sm text-slate-500">hoàn thành đúng hạn</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <BookOpenText className="text-teal-700" size={20} />
                    <p className="mt-4 text-3xl font-black text-slate-950">06</p>
                    <p className="mt-1 text-sm text-slate-500">bài đang cần chấm</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="font-bold text-slate-900">Tiến độ tuần này</p>
                      <span className="text-xs font-bold text-teal-700">+12%</span>
                    </div>
                    <div className="flex h-24 items-end gap-2">
                      {[40, 64, 52, 78, 68, 88, 82].map((height, index) => (
                        <span
                          className="flex-1 rounded-t-lg bg-teal-100 last:bg-[#087f72]"
                          style={{ height: `${height}%` }}
                          key={`${height}-${index}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="bg-[#102a2b] px-5 py-20 text-white lg:px-8" id="tinh-nang">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#d9f36b]">
              Tập trung vào giảng dạy
            </p>
            <h2 className="font-display mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Ít chuyển tab hơn, nhiều thời gian cho học sinh hơn.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }, index) => (
              <article
                className="rounded-3xl border border-white/10 bg-white/[0.06] p-7 transition hover:-translate-y-1 hover:bg-white/[0.09]"
                key={title}
              >
                <span
                  className={`grid h-12 w-12 place-items-center rounded-2xl ${
                    index === 1
                      ? "bg-[#ff7a5c] text-white"
                      : "bg-[#d9f36b] text-[#102a2b]"
                  }`}
                >
                  <Icon size={23} />
                </span>
                <h3 className="mt-7 text-xl font-bold">{title}</h3>
                <p className="mt-3 leading-7 text-slate-300">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-8" id="quy-trinh">
        <div className="mx-auto grid max-w-7xl gap-10 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm lg:grid-cols-[.7fr_1.3fr] lg:p-12">
          <div>
            <StatusPill tone="amber">Một vòng dạy học hoàn chỉnh</StatusPill>
            <h2 className="font-display mt-5 text-4xl font-bold tracking-tight text-slate-950">
              Từ kế hoạch đến phản hồi, liền một mạch.
            </h2>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2" id="hoc-lieu">
            {[
              ["01", "Lên lịch & chia sẻ", "Chuẩn bị bài giảng và học liệu trước giờ học."],
              ["02", "Giao nhiệm vụ", "Cả lớp hoặc từng nhóm nhận đúng nội dung."],
              ["03", "Nộp & chấm", "Lưu từng lượt nộp, chấm tự động và thủ công."],
              ["04", "Theo dõi tiến bộ", "Bảng điểm và tín hiệu giúp giáo viên điều chỉnh."],
            ].map(([number, title, text]) => (
              <li className="rounded-2xl bg-[#f7f8f2] p-5" key={number}>
                <span className="text-sm font-black text-teal-700">{number}</span>
                <p className="mt-5 font-bold text-slate-950">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <BrandMark />
          <p>© 2026 Lớp Việt. Nền tảng độc lập dành cho giảng dạy.</p>
        </div>
      </footer>
    </main>
  );
}
