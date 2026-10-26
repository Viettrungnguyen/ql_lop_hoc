"use client";

import { BookOpenText, CalendarDays, FileText, LayoutList, LoaderCircle, UsersRound } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

export function ClassroomTabs({ classId }: { classId: string }) {
  const pathname = usePathname();
  const basePath = `/dashboard/classes/${classId}`;
  const tabs = [
    [LayoutList, "Bảng tin", basePath],
    [CalendarDays, "Lịch học", `${basePath}/calendar`],
    [BookOpenText, "Bài giảng", `${basePath}/lessons`],
    [FileText, "Tài liệu", `${basePath}/resources`],
    [UsersRound, "Thành viên", `${basePath}/members`],
  ] as const;

  return (
    <nav className="mt-7 flex gap-1 overflow-x-auto pb-3" aria-label="Điều hướng lớp học">
      {tabs.map(([Icon, label, href], index) => {
        const active = index === 0
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              active
                ? "bg-teal-50 text-teal-800 shadow-sm shadow-teal-900/5"
                : "text-slate-500 hover:bg-teal-50 hover:text-teal-800"
            }`}
            href={href}
            key={href}
          >
            <Icon size={17} />{label}<TabPendingIndicator />
          </Link>
        );
      })}
    </nav>
  );
}

function TabPendingIndicator() {
  const { pending } = useLinkStatus();
  return pending ? <LoaderCircle className="animate-spin" size={14} aria-hidden="true" /> : null;
}
