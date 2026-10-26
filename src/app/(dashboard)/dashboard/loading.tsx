export default function DashboardLoading() {
  return (
    <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8" role="status" aria-live="polite" aria-label="Đang tải trang">
      <div className="absolute inset-x-5 top-0 h-1 overflow-hidden rounded-full bg-teal-100 sm:inset-x-8">
        <span className="route-loading-bar block h-full w-1/3 rounded-full bg-teal-600" />
      </div>
      <div className="animate-pulse">
        <div className="h-3 w-28 rounded-full bg-teal-100" />
        <div className="mt-4 h-10 w-full max-w-md rounded-2xl bg-slate-200" />
        <div className="mt-3 h-4 w-full max-w-xl rounded-full bg-slate-200/80" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => <div className="h-40 rounded-3xl border border-slate-200 bg-white" key={item} />)}
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.45fr_.75fr]">
          <div className="h-80 rounded-3xl border border-slate-200 bg-white" />
          <div className="h-80 rounded-3xl bg-slate-200" />
        </div>
      </div>
      <span className="sr-only">Đang tải nội dung...</span>
    </div>
  );
}
