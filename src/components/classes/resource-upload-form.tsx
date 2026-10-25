"use client";

import { UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AudienceSelect } from "@/components/classes/audience-select";
import { createClient } from "@/lib/supabase/client";

const allowedExtensions = new Set(["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "png", "jpg", "jpeg", "webp", "mp3", "mp4"]);

export function ResourceUploadForm({ classId, groups }: { classId: string; groups: { id: string; name: string }[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();

  async function upload(formData: FormData) {
    setBusy(true);
    setMessage(undefined);
    const file = formData.get("file");
    if (!(file instanceof File) || !file.size) {
      setMessage("Hãy chọn một tệp.");
      setBusy(false);
      return;
    }
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowedExtensions.has(extension)) {
      setMessage("Định dạng tệp chưa được hỗ trợ.");
      setBusy(false);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setMessage("Tệp phải nhỏ hơn hoặc bằng 50 MB.");
      setBusy(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Phiên đăng nhập đã hết hạn.");
      setBusy(false);
      return;
    }

    const resourceId = crypto.randomUUID();
    const groupId = String(formData.get("groupId") || "");
    const safeName = file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-");
    const storagePath = `${classId}/resources/${resourceId}/${safeName}`;
    const { error: uploadError } = await supabase.storage.from("class-files").upload(storagePath, file, { cacheControl: "3600", upsert: false });
    if (uploadError) {
      setMessage("Không thể tải tệp lên Storage.");
      setBusy(false);
      return;
    }

    if (groupId) {
      const { error: targetError } = await supabase.from("content_targets").insert({
        class_id: classId,
        entity_type: "resource",
        entity_id: resourceId,
        target_type: "group",
        target_group_id: groupId,
      });
      if (targetError) {
        await supabase.storage.from("class-files").remove([storagePath]);
        setMessage("Nhóm nhận tài liệu chưa hợp lệ.");
        setBusy(false);
        return;
      }
    }

    const { error: recordError } = await supabase.from("class_resources").insert({
      id: resourceId,
      class_id: classId,
      created_by: user.id,
      title: file.name,
      kind: "file",
      storage_path: storagePath,
      mime_type: file.type || null,
      size_bytes: file.size,
      status: "published",
    });
    if (recordError) {
      await supabase.storage.from("class-files").remove([storagePath]);
      await supabase.from("content_targets").delete().eq("entity_type", "resource").eq("entity_id", resourceId);
      setMessage("Đã hủy upload vì không thể lưu thông tin tài liệu.");
      setBusy(false);
      return;
    }

    setMessage("Đã tải tài liệu lên lớp.");
    setBusy(false);
    router.refresh();
  }

  return (
    <form action={upload} className="rounded-2xl border border-dashed border-slate-300 bg-[#fafbf8] p-4">
      <label className="block cursor-pointer text-center"><UploadCloud className="mx-auto text-teal-700" size={25} /><span className="mt-2 block text-sm font-bold text-slate-700">Chọn tệp từ máy</span><span className="mt-1 block text-xs text-slate-400">PDF, Office, ảnh, audio hoặc video · tối đa 50 MB</span><input className="sr-only" name="file" type="file" required accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.mp3,.mp4" /></label>
      <div className="mt-4 text-left"><AudienceSelect groups={groups} /></div>
      <button className="mt-4 w-full rounded-xl bg-[#102a2b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50" disabled={busy}>{busy ? "Đang tải lên..." : "Tải tài liệu"}</button>
      {message && <p className="mt-3 text-center text-xs font-semibold text-slate-600">{message}</p>}
    </form>
  );
}
