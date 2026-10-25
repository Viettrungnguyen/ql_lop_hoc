import { ExternalLink, FileText, FolderOpen } from "lucide-react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type Resource = { id: string; class_id: string; title: string; kind: "file" | "link"; storage_path: string | null; external_url: string | null };

export default async function MaterialsPage() {
  const supabase = await createClient();
  const [{ data: resources }, { data: classes }] = await Promise.all([
    supabase.from("class_resources").select("id,class_id,title,kind,storage_path,external_url").order("created_at", { ascending: false }).limit(100),
    supabase.from("classes").select("id,name").eq("status", "active"),
  ]);
  const names = new Map((classes ?? []).map((item) => [item.id, item.name]));
  const items = await Promise.all(((resources ?? []) as Resource[]).map(async (item) => {
    if (item.kind !== "file" || !item.storage_path) return { ...item, href: item.external_url };
    const { data } = await supabase.storage.from("class-files").createSignedUrl(item.storage_path, 600);
    return { ...item, href: data?.signedUrl };
  }));

  return <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8"><p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">Từ các lớp của bạn</p><h1 className="font-display mt-3 text-5xl font-bold text-slate-950">Tài liệu học tập</h1><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.length ? items.map((item) => <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" key={item.id}><span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-700">{item.kind === "file" ? <FileText size={21} /> : <ExternalLink size={21} />}</span><p className="mt-5 text-xs font-bold uppercase tracking-wide text-teal-700">{names.get(item.class_id) || "Lớp học"}</p><h2 className="mt-2 break-words font-black text-slate-950">{item.title}</h2><div className="mt-5 flex gap-2">{item.href && <a className="inline-flex items-center gap-2 rounded-xl bg-[#102a2b] px-4 py-2.5 text-sm font-bold text-white" href={item.href} target="_blank" rel="noreferrer">Mở <ExternalLink size={14} /></a>}<Link className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600" href={`/dashboard/classes/${item.class_id}/resources`}>Vào lớp</Link></div></article>) : <div className="col-span-full grid min-h-72 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white/50 text-center"><div><FolderOpen className="mx-auto text-slate-300" size={38} /><p className="mt-4 font-black text-slate-800">Chưa có tài liệu</p></div></div>}</div></div>;
}
