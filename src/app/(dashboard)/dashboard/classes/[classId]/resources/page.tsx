import { ExternalLink, File, FileText, Link2, Plus } from "lucide-react";

import { AudienceSelect } from "@/components/classes/audience-select";
import { ResourceUploadForm } from "@/components/classes/resource-upload-form";
import { FlashMessage } from "@/components/flash-message";
import { createResourceLink } from "@/features/classes/actions";
import { createClient } from "@/lib/supabase/server";

type Resource = { id: string; title: string; description: string | null; kind: "file" | "link"; storage_path: string | null; external_url: string | null; mime_type: string | null; size_bytes: number | null; created_at: string; signedUrl?: string };

export default async function ResourcesPage({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams: Promise<{ error?: string; message?: string }> }) {
  const [{ classId }, flash] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: membership }, { data: resources }, { data: groups }] = await Promise.all([
    supabase.from("class_members").select("role,capabilities").eq("class_id", classId).eq("user_id", user!.id).eq("status", "active").single(),
    supabase.from("class_resources").select("id,title,description,kind,storage_path,external_url,mime_type,size_bytes,created_at").eq("class_id", classId).order("created_at", { ascending: false }),
    supabase.from("groups").select("id,name").eq("class_id", classId).is("deleted_at", null).order("name"),
  ]);
  const manager = membership?.role === "owner" || membership?.role === "teacher" || Boolean(membership?.capabilities?.manage_content);
  const resourceList = await Promise.all(((resources ?? []) as Resource[]).map(async (resource) => {
    if (resource.kind !== "file" || !resource.storage_path) return resource;
    const { data } = await supabase.storage.from("class-files").createSignedUrl(resource.storage_path, 600);
    return { ...resource, signedUrl: data?.signedUrl };
  }));

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:px-8 xl:grid-cols-[1fr_380px]">
      <section><FlashMessage error={flash.error} message={flash.message} /><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Tài nguyên lớp học</p><h2 className="font-display mt-2 text-3xl font-bold text-slate-950">Tài liệu</h2></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">{resourceList.length ? resourceList.map((resource) => <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" key={resource.id}><div className="flex items-start gap-4"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${resource.kind === "file" ? "bg-blue-50 text-blue-700" : "bg-teal-50 text-teal-700"}`}>{resource.kind === "file" ? <File size={22} /> : <Link2 size={22} />}</span><div className="min-w-0"><h3 className="break-words font-black text-slate-950">{resource.title}</h3><p className="mt-1 text-xs text-slate-400">{resource.kind === "file" ? formatBytes(resource.size_bytes) : "Liên kết ngoài"}</p></div></div>{resource.description && <p className="mt-4 text-sm leading-6 text-slate-600">{resource.description}</p>}{(resource.external_url || resource.signedUrl) && <a className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#102a2b] px-4 py-2.5 text-sm font-bold text-white" href={resource.external_url || resource.signedUrl} target="_blank" rel="noreferrer">{resource.kind === "file" ? "Xem / tải xuống" : "Mở tài liệu"}<ExternalLink size={15} /></a>}</article>) : <div className="col-span-full grid min-h-64 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white/60 text-center"><div><FileText className="mx-auto text-slate-300" size={36} /><p className="mt-4 font-black text-slate-800">Chưa có tài liệu</p></div></div>}</div>
      </section>
      {manager && <aside className="h-fit space-y-4 xl:sticky xl:top-28"><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Plus size={18} /></span><h2 className="font-black text-slate-950">Thêm tài liệu</h2></div><div className="mt-5"><ResourceUploadForm classId={classId} groups={groups ?? []} /></div><div className="my-5 flex items-center gap-3 text-xs font-bold uppercase text-slate-300"><span className="h-px flex-1 bg-slate-200" />hoặc liên kết<span className="h-px flex-1 bg-slate-200" /></div><form action={createResourceLink} className="space-y-3"><input name="classId" type="hidden" value={classId} /><input className="field" name="title" placeholder="Tên tài liệu" required maxLength={200} /><input className="field" name="externalUrl" type="url" placeholder="https://..." required /><textarea className="field min-h-20" name="description" placeholder="Mô tả (không bắt buộc)" maxLength={2000} /><AudienceSelect groups={groups ?? []} /><button className="w-full rounded-xl bg-[#087f72] px-4 py-3 text-sm font-bold text-white">Thêm liên kết</button></form></div></aside>}
    </div>
  );
}

function formatBytes(value: number | null) { if (!value) return "Tệp đính kèm"; if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`; return `${(value / 1024 / 1024).toFixed(1)} MB`; }
