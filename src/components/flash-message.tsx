import { AlertCircle, CheckCircle2 } from "lucide-react";

export function FlashMessage({ error, message }: { error?: string; message?: string }) {
  const text = error ?? message;
  if (!text) return null;

  return (
    <div className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${error ? "border-red-200 bg-red-50 text-red-700" : "border-teal-200 bg-teal-50 text-teal-800"}`}>
      {error ? <AlertCircle className="mt-0.5 shrink-0" size={18} /> : <CheckCircle2 className="mt-0.5 shrink-0" size={18} />}
      <span>{text}</span>
    </div>
  );
}
