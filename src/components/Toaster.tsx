"use client";

import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToasts } from "@/lib/toast-store";

export default function Toaster() {
  const items = useToasts((s) => s.items);
  const dismiss = useToasts((s) => s.dismiss);

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={[
            "pointer-events-auto min-w-[260px] max-w-sm rounded-md shadow-lg px-4 py-3 flex items-start gap-2 text-sm animate-in slide-in-from-right",
            t.kind === "success" && "bg-green-50 border border-green-200 text-green-800",
            t.kind === "error" && "bg-red-50 border border-red-200 text-red-800",
            t.kind === "info" && "bg-blue-50 border border-blue-200 text-blue-800",
          ].filter(Boolean).join(" ")}
          role="status"
        >
          {t.kind === "success" && <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />}
          {t.kind === "error" && <XCircle size={18} className="flex-shrink-0 mt-0.5" />}
          {t.kind === "info" && <Info size={18} className="flex-shrink-0 mt-0.5" />}
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="dismiss"
            className="opacity-60 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
