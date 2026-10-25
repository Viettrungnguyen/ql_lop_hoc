import { ArrowRight, BookOpen, GraduationCap, KeyRound, Plus, UsersRound } from "lucide-react";
import Link from "next/link";

import { FlashMessage } from "@/components/flash-message";
import { createClass, joinClass } from "@/features/classes/actions";
import { createClient } from "@/lib/supabase/server";

type ClassCard = {
  id: string;
  name: string;
  description: string | null;
  academic_year: string | null;
  join_code_hint: string;
  subject: { name: string } | null;
  grade: { name: string } | null;
};

export default async function ClassesPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: classes }, { data: subjects }, { data: grades }] = await Promise.all([
    supabase.from("classes").select("id,name,description,academic_year,join_code_hint,subject:subjects(name),grade:grade_levels(name)").eq("status", "active").order("created_at", { ascending: false }),
    supabase.from("subjects").select("id,name").eq("active", true).order("position"),
    supabase.from("grade_levels").select("id,name").eq("active", true).order("position"),
  ]);
  const classList = (classes ?? []) as unknown as ClassCard[];

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
      <FlashMessage error={params.error} message={params.message} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">Không gian giảng dạy</p>
          <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Lớp học của bạn</h1>
          <p className="mt-3 text-slate-500">Tạo lớp mới hoặc tham gia bằng mã do giáo viên chia sẻ.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm"><GraduationCap size={17} className="text-teal-700" /> {classList.length} lớp đang hoạt động</span>
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[1fr_360px]">
        <section>
          {classList.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {classList.map((classroom, index) => (
                <Link className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5" href={`/dashboard/classes/${classroom.id}`} key={classroom.id}>
                  <div className={`h-2 ${index % 3 === 0 ? "bg-teal-600" : index % 3 === 1 ? "bg-[#ff7a5c]" : "bg-[#bedc45]"}`} />
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef4ed] text-teal-700"><BookOpen size={22} /></span><ArrowRight className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-teal-700" size={20} /></div>
                    <h2 className="mt-6 text-xl font-black text-slate-950">{classroom.name}</h2>
                    <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{classroom.description || "Chưa có mô tả lớp học."}</p>
                    <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                      {classroom.grade?.name && <span className="rounded-full bg-slate-100 px-3 py-1.5">{classroom.grade.name}</span>}
                      {classroom.subject?.name && <span className="rounded-full bg-teal-50 px-3 py-1.5 text-teal-800">{classroom.subject.name}</span>}
                      <span className="rounded-full bg-slate-100 px-3 py-1.5">Mã ··{classroom.join_code_hint}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid min-h-80 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white/60 px-8 text-center"><div className="max-w-sm"><span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-teal-50 text-teal-700"><UsersRound size={28} /></span><h2 className="mt-5 text-xl font-black text-slate-950">Chưa có lớp học nào</h2><p className="mt-2 text-sm leading-6 text-slate-500">Dùng biểu mẫu bên cạnh để tạo lớp hoặc nhập mã tham gia.</p></div></div>
          )}
        </section>

        <aside className="space-y-5">
          <details className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" open={!classList.length}>
            <summary className="flex cursor-pointer list-none items-center gap-3 font-black text-slate-950"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#102a2b] text-white"><Plus size={18} /></span>Tạo lớp mới</summary>
            <form action={createClass} className="mt-6 space-y-4">
              <Field label="Tên lớp"><input className="field" name="name" placeholder="Ví dụ: Toán 10A2" required minLength={2} maxLength={120} /></Field>
              <Field label="Mô tả"><textarea className="field min-h-20 resize-y" name="description" placeholder="Mục tiêu và thông tin ngắn về lớp" maxLength={2000} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Khối/lớp"><select className="field" name="gradeLevelId"><option value="">Chọn khối</option>{grades?.map((grade) => <option value={grade.id} key={grade.id}>{grade.name}</option>)}</select></Field>
                <Field label="Môn học"><select className="field" name="subjectId"><option value="">Chọn môn</option>{subjects?.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select></Field>
              </div>
              <Field label="Năm học"><input className="field" name="academicYear" placeholder="2026–2027" maxLength={20} /></Field>
              <button className="w-full rounded-2xl bg-[#087f72] px-5 py-3.5 font-bold text-white transition hover:bg-[#075b55]">Tạo lớp học</button>
            </form>
          </details>
          <div className="rounded-3xl bg-[#102a2b] p-6 text-white shadow-xl shadow-slate-900/10">
            <div className="flex items-center gap-3"><KeyRound className="text-[#d9f36b]" size={20} /><h2 className="font-black">Tham gia bằng mã</h2></div>
            <form action={joinClass} className="mt-5"><input className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 font-mono uppercase text-white outline-none placeholder:text-slate-400 focus:border-[#d9f36b]" name="joinCode" placeholder="NHẬP MÃ LỚP" required minLength={4} maxLength={20} /><button className="mt-3 w-full rounded-2xl bg-[#d9f36b] px-5 py-3.5 font-black text-[#102a2b] transition hover:bg-[#e6f88f]">Gửi yêu cầu tham gia</button></form>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>{children}</label>;
}
