import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { login } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "Đăng nhập" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">
        Chào mừng trở lại
      </p>
      <h2 className="font-display mt-3 text-4xl font-bold tracking-tight text-slate-950">
        Tiếp tục lớp học của bạn.
      </h2>
      <p className="mt-3 leading-7 text-slate-500">
        Đăng nhập để xem lịch học, nhiệm vụ và tiến độ mới nhất.
      </p>

      {params.error && (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {params.error}
        </p>
      )}
      {params.message && (
        <p className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800">
          {params.message}
        </p>
      )}

      <form action={login} className="mt-8 space-y-5">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Email</span>
          <span className="relative mt-2 block">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="soft-ring w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-12 pr-4 text-slate-950 placeholder:text-slate-400"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="giaovien@truong.edu.vn"
              required
            />
          </span>
        </label>
        <label className="block">
          <span className="flex items-center justify-between text-sm font-bold text-slate-700">
            Mật khẩu
            <span className="font-semibold text-teal-700">Tối thiểu 8 ký tự</span>
          </span>
          <span className="relative mt-2 block">
            <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="soft-ring w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-12 pr-4 text-slate-950"
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={8}
              required
            />
          </span>
        </label>
        <button className="soft-ring flex w-full items-center justify-center gap-2 rounded-2xl bg-[#087f72] px-6 py-4 font-bold text-white shadow-lg shadow-teal-900/10 transition hover:bg-[#075b55]" type="submit">
          Đăng nhập <ArrowRight size={18} />
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-500">
        Chưa có tài khoản?{" "}
        <Link className="font-bold text-teal-700 hover:text-teal-900" href="/register">
          Đăng ký miễn phí
        </Link>
      </p>
    </div>
  );
}
