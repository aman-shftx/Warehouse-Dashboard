"use client";

import { useState } from "react";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Layers, 
  CalendarDays,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Info
} from "lucide-react";
import { MovementTrackerCard } from "./MovementTrackerCard";
import { MovementDataResponse } from "@/lib/movement";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  initialData: MovementDataResponse;
}

export function OverviewMovementDashboard({ initialData }: Props) {
  const [activeTab, setActiveTab] = useState<"all" | "outward" | "inward">("all");

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto pb-12">
      {/* 1. Page Header & Operational Context Bar */}
      <div className="bg-white rounded-lg border border-slate-200/80 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Overview & Material Movement
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Tracking
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated outward dispatch velocity and inward receipt reconciliation.
            </p>
          </div>

          {/* Operational Delay Badge & Date Indicator */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50/80 border border-amber-200/70 text-amber-900 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>1-Day Delay Mode: Data till {formatDate(initialData.latestDate)}</span>
            </div>

            {/* View Switcher Pills */}
            <div className="inline-flex items-center p-0.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium">
              <button
                onClick={() => setActiveTab("all")}
                className={cn(
                  "px-2.5 py-1 rounded transition-all text-xs font-semibold",
                  activeTab === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                )}
              >
                All Flows
              </button>
              <button
                onClick={() => setActiveTab("outward")}
                className={cn(
                  "px-2.5 py-1 rounded transition-all text-xs font-semibold flex items-center gap-1",
                  activeTab === "outward"
                    ? "bg-rose-700 text-white shadow-xs"
                    : "text-slate-600 hover:text-rose-700 hover:bg-rose-50/60"
                )}
              >
                <ArrowUpRight className="w-3 h-3" />
                Outward
              </button>
              <button
                onClick={() => setActiveTab("inward")}
                className={cn(
                  "px-2.5 py-1 rounded transition-all text-xs font-semibold flex items-center gap-1",
                  activeTab === "inward"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60"
                )}
              >
                <ArrowDownLeft className="w-3 h-3" />
                Inward
              </button>
            </div>
          </div>
        </div>

        {/* 1-day Reporting delay clarification bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-700 font-semibold">Inventory Delay Notice:</strong> Warehouse inventory updates on a 1-day delay schedule. Today&apos;s view presents closing balances up to yesterday ({formatDate(initialData.latestDate)}). Today&apos;s active transactions will be reconciled and reflected in tomorrow&apos;s snapshot.
          </p>
        </div>
      </div>

      {/* 2. Master Card: Material Outward Tracker */}
      {(activeTab === "all" || activeTab === "outward") && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                Outward Flow Analysis
              </h2>
            </div>
          </div>

          <MovementTrackerCard
            type="outward"
            initialData={initialData.outward}
            initialDays={initialData.days}
            latestDate={initialData.latestDate}
            prevDate={initialData.prevDate}
          />
        </section>
      )}

      {/* 3. Master Card: Material Inward Tracker */}
      {(activeTab === "all" || activeTab === "inward") && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                Inward Flow Analysis
              </h2>
            </div>
          </div>

          <MovementTrackerCard
            type="inward"
            initialData={initialData.inward}
            initialDays={initialData.days}
            latestDate={initialData.latestDate}
            prevDate={initialData.prevDate}
          />
        </section>
      )}
    </div>
  );
}
