"use client";

import { useState } from "react";
import { RefreshCw, Search, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function Header() {
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    setSyncMsg(null);

    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncMsg({ type: "success", text: `Synced in ${data.duration}!` });
        router.refresh();
      } else {
        setSyncMsg({ type: "error", text: data.error || "Sync failed" });
      }
    } catch (err: any) {
      setSyncMsg({ type: "error", text: err.message || "Failed to trigger sync" });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 5000);
    }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Warehouse Operations</h2>
        <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Mirror
        </span>
      </div>

      <div className="flex items-center gap-4">
        {syncMsg && (
          <div
            className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium ${
              syncMsg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-rose-50 border-rose-200 text-rose-700"
            }`}
          >
            {syncMsg.type === "success" ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            )}
            {syncMsg.text}
          </div>
        )}

        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all duration-150 disabled:opacity-50 active:scale-95 shadow-sm"
          title="Manually trigger Google Sheet sync to Supabase"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${syncing ? "animate-spin text-indigo-600" : ""}`} />
          {syncing ? "Syncing Sheet..." : "Sync Sheet Now"}
        </button>
      </div>
    </header>
  );
}
