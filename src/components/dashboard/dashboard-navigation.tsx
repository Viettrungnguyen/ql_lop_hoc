"use client";

import {
  BookOpenText,
  CalendarDays,
  FolderTree,
  GraduationCap,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  X,
} from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { BrandMark } from "@/components/brand-mark";

const navigation = [
  [LayoutDashboard, "Tổng quan", "/dashboard"],
  [GraduationCap, "Lớp học", "/dashboard/classes"],
  [CalendarDays, "Lịch", "/dashboard/calendar"],
  [FolderTree, "Học liệu", "/dashboard/materials"],
  [BookOpenText, "Bài tập", "/dashboard/assignments"],
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1.5" aria-label="Điều hướng chính">
      {navigation.map(([Icon, label, href]) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
              active
                ? "bg-[#e5f4ef] text-[#075b55] shadow-sm shadow-teal-900/5"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
            href={href}
            key={href}
            onClick={onNavigate}
          >
            <Icon size={19} /> {label}<LinkPendingIndicator />
          </Link>
        );
      })}
    </nav>
  );
}

function LinkPendingIndicator() {
  const { pending } = useLinkStatus();
  return pending ? <LoaderCircle className="ml-auto animate-spin" size={15} aria-hidden="true" /> : null;
}

export function MobileDashboardMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  return (
    <>
      <button
        aria-expanded={open}
        aria-label="Mở menu"
        className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 lg:hidden"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Menu size={20} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Đóng menu"
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            type="button"
          />
          <aside className="relative flex h-full w-[min(82vw,320px)] flex-col bg-white p-5 shadow-2xl" role="dialog" aria-modal="true" aria-label="Menu điều hướng">
            <div className="flex items-center justify-between">
              <BrandMark />
              <button className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600" onClick={() => setOpen(false)} type="button" aria-label="Đóng menu"><X size={19} /></button>
            </div>
            <div className="mt-9"><DashboardNavigation onNavigate={() => setOpen(false)} /></div>
            <div className="mt-auto rounded-2xl bg-[#102a2b] p-4 text-white"><p className="text-xs font-bold uppercase tracking-widest text-[#d9f36b]">Giai đoạn 2</p><p className="mt-2 text-sm font-bold">Tổ chức dạy học</p><p className="mt-1 text-xs leading-5 text-slate-300">Lớp học, lịch, bài giảng và tài liệu đã sẵn sàng.</p></div>
          </aside>
        </div>
      )}
    </>
  );
}
