import Link from "next/link";

import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      className={cn("inline-flex items-center gap-3", className)}
      href="/"
      aria-label="Trang chủ Lớp Việt"
    >
      <span className="brand-symbol" aria-hidden="true">
        <span />
        <span />
      </span>
      {!compact && (
        <span className="font-display text-xl font-extrabold tracking-tight text-slate-950">
          Lớp Việt
        </span>
      )}
    </Link>
  );
}
