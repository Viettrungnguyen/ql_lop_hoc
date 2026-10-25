import { cn } from "@/lib/utils";

export function StatusPill({
  children,
  tone = "teal",
}: {
  children: React.ReactNode;
  tone?: "teal" | "amber" | "blue";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold",
        tone === "teal" && "bg-teal-50 text-teal-800",
        tone === "amber" && "bg-amber-50 text-amber-800",
        tone === "blue" && "bg-blue-50 text-blue-800",
      )}
    >
      {children}
    </span>
  );
}
