import { BookOpenCheck, ChartNoAxesCombined, ShieldCheck } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="page-grid min-h-screen bg-[#f7f8f2] p-4 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[.92fr_1.08fr]">
        <section className="relative hidden overflow-hidden bg-[#102a2b] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-28 -top-24 h-80 w-80 rounded-full border-[44px] border-[#d9f36b]/20" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#087f72] blur-2xl" />
          <BrandMark className="relative z-10 [&_span:last-child]:text-white" />
          <div className="relative z-10 max-w-md">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#d9f36b]">
              Không gian dạy học tập trung
            </p>
            <h1 className="font-display mt-5 text-5xl font-bold leading-tight tracking-tight">
              Mỗi tiết học đều có một mạch tiến bộ.
            </h1>
            <div className="mt-10 grid gap-4">
              {[
                [BookOpenCheck, "Bài giảng và học liệu đúng chỗ"],
                [ChartNoAxesCombined, "Tiến độ rõ tới từng học sinh"],
                [ShieldCheck, "Dữ liệu lớp được bảo vệ theo vai trò"],
              ].map(([Icon, label]) => {
                const ItemIcon = Icon as typeof BookOpenCheck;
                return (
                  <div className="flex items-center gap-3 text-slate-200" key={label as string}>
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
                      <ItemIcon size={18} />
                    </span>
                    <span className="font-semibold">{label as string}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="relative z-10 text-sm text-slate-400">
            Xây dựng cho giáo viên và học sinh Việt Nam.
          </p>
        </section>
        <section className="flex min-h-full items-center justify-center p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-md">
            <BrandMark className="mb-10 lg:hidden" />
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
