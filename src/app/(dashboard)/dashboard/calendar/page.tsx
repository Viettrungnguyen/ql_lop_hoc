export default function CalendarPage() {
  return <Placeholder title="Lịch dạy và học" description="Lịch một lần, lịch lặp và nhắc giờ được triển khai ở Giai đoạn 2." />;
}

function Placeholder({ title, description }: { title: string; description: string }) {
  return <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8"><p className="text-sm font-bold uppercase tracking-widest text-teal-700">Sắp ra mắt</p><h1 className="font-display mt-3 text-5xl font-bold text-slate-950">{title}</h1><p className="mt-4 max-w-xl text-lg leading-8 text-slate-500">{description}</p></div>;
}
