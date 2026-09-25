"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2, AlertCircle, PanelLeftClose, PanelLeftOpen, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import { useSearch } from "./SearchContext";

export function Header() {
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { searchQuery, setSearchQuery, searchInputRef } = useSearch();

  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    setSyncMsg(null);

    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncMsg({ type: "success", text: `Synced in ${data.duration}` });
        router.refresh();
      } else {
        setSyncMsg({ type: "error", text: data.error || "Sync failed" });
      }
    } catch (err: any) {
      setSyncMsg({ type: "error", text: err.message || "Failed to trigger sync" });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  }

  return (
    <header className="h-14 bg-white/95 backdrop-blur border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0 gap-4">
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-1.5 -ml-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition-all duration-100"
          title={isCollapsed ? "Expand sidebar ([)" : "Collapse sidebar ([)"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-slate-600" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-slate-500" />
          )}
        </button>
        <span className="h-4 w-px bg-slate-200" />
        <h2 className="text-[13px] font-semibold text-slate-900 tracking-tight">Warehouse Operations</h2>
        <span className="text-slate-300">/</span>
        <span className="text-xs text-slate-700 font-semibold">Inventory</span>
      </div>

      {/* Global Search Bar in Header */}
      <div className="flex-1 max-w-lg mx-auto">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU code, title, brand... (Press / to focus)"
            className="w-full h-8 pl-8 pr-8 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-100 text-slate-800 placeholder:text-slate-400 font-medium"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200/80 rounded pointer-events-none">
              /
            </kbd>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {syncMsg && (
          <div
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border font-medium animate-in fade-in duration-100 ${
              syncMsg.type === "success"
                ? "bg-emerald-50/80 border-emerald-200/80 text-emerald-800"
                : "bg-rose-50/80 border-rose-200/80 text-rose-800"
            }`}
          >
            {syncMsg.type === "success" ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span>{syncMsg.text}</span>
          </div>
        )}

        {/* Sync Button: Behind the Button pattern (fixed width, zero layout shift) */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="relative inline-flex items-center justify-center gap-2 w-36 h-8 px-3 rounded-md text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300/90 active:scale-[0.98] transition-all duration-100 disabled:opacity-60 disabled:cursor-not-allowed shadow-none"
          title="Manually sync Google Sheet into Supabase"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${syncing ? "animate-spin text-indigo-600" : ""}`} />
          <span className="whitespace-nowrap">{syncing ? "Syncing..." : "Sync Sheet Now"}</span>
        </button>
      </div>
    </header>
  );
}
