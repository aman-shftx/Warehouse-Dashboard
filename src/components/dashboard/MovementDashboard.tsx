"use client";

import { useSearchParams } from "next/navigation";
import { MovementTrackerCard } from "./MovementTrackerCard";
import { MovementDataResponse } from "@/lib/movement";
import { formatDate } from "@/lib/utils";
import { Clock, ArrowLeftRight, TrendingDown, TrendingUp } from "lucide-react";

interface Props {
  initialData: MovementDataResponse;
}

export function MovementDashboard({ initialData }: Props) {
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get("type"); // "outward" | "inward" | null

  return (
    <div className="space-y-4 max-w-[1700px] mx-auto pb-10">
      {/* 1. Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-indigo-50 text-indigo-600">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Inventory Movement Trackers
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Material Inward & Outward daily reconciliation, 14-day stock flow velocity, and exportable audit logs.
          </p>
        </div>

        {/* Operational Snapshot Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-medium self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Inventory Snapshot: Closing balance as of {formatDate(initialData.latestDate)} (T-1 Delay)</span>
        </div>
      </div>

      {/* 2. Side-by-Side: Outward on Left, Inward on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Outward Tracker (Left) */}
        <div className={typeFilter === "outward" ? "ring-2 ring-indigo-500 rounded-lg" : ""}>
          <MovementTrackerCard
            type="outward"
            initialData={initialData.outward}
            initialDays={initialData.days}
            latestDate={initialData.latestDate}
            prevDate={initialData.prevDate}
          />
        </div>

        {/* Inward Tracker (Right) */}
        <div className={typeFilter === "inward" ? "ring-2 ring-emerald-500 rounded-lg" : ""}>
          <MovementTrackerCard
            type="inward"
            initialData={initialData.inward}
            initialDays={initialData.days}
            latestDate={initialData.latestDate}
            prevDate={initialData.prevDate}
          />
        </div>
      </div>
    </div>
  );
}
