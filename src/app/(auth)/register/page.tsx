import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { register } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "Đăng ký" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">
        Bắt đầu trong vài phút
      </p>
      <h2 className="font-display mt-3 text-4xl font-bold tracking-tight text-slate-950">
        Tạo không gian học tập của bạn.
      </h2>
      <p className="mt-3 leading-7 text-slate-500">
        Vai trò ban đầu chỉ giúp cá nhân hóa giao diện; quyền thật được quản lý theo từng lớp.
      </p>

      {params.error && (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {params.error}
        </p>
      )}

      <form action={register} className="mt-7 space-y-4">
        <fieldset>
          <legend className="text-sm font-bold text-slate-700">Tôi sử dụng Lớp Việt để</legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {[
              ["teacher", "Giảng dạy"],
              ["student", "Học tập"],
            ].map(([value, label]) => (
              <label className="cursor-pointer" key={value}>
                <input className="peer sr-only" defaultChecked={value === "teacher"} name="mode" type="radio" value={value} />
                <span className="block rounded-2xl border border-slate-300 px-4 py-3 text-center text-sm font-bold text-slate-600 transition peer-checked:border-teal-700 peer-checked:bg-teal-50 peer-checked:text-teal-800">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Họ và tên</span>
          <span className="relative mt-2 block">
            <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input className="soft-ring w-full rounded-2xl border border-slate-300 py-3.5 pl-12 pr-4" name="displayName" autoComplete="name" minLength={2} maxLength={80} required />
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Email</span>
          <span className="relative mt-2 block">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input className="soft-ring w-full rounded-2xl border border-slate-300 py-3.5 pl-12 pr-4" name="email" type="email" autoComplete="email" required />
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Mật khẩu</span>
          <span className="relative mt-2 block">
            <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input className="soft-ring w-full rounded-2xl border border-slate-300 py-3.5 pl-12 pr-4" name="password" type="password" autoComplete="new-password" minLength={8} required />
          </span>
        </label>
        <button className="soft-ring flex w-full items-center justify-center gap-2 rounded-2xl bg-[#087f72] px-6 py-4 font-bold text-white transition hover:bg-[#075b55]" type="submit">
          Tạo tài khoản <ArrowRight size={18} />
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Đã có tài khoản?{" "}
        <Link className="font-bold text-teal-700" href="/login">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
