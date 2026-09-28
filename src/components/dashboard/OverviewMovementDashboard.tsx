"use client";

import { MovementTrackerCard } from "./MovementTrackerCard";
import { MovementDataResponse } from "@/lib/movement";
import { formatDate } from "@/lib/utils";
import { Clock } from "lucide-react";

interface Props {
  initialData: MovementDataResponse;
}

export function OverviewMovementDashboard({ initialData }: Props) {
  return (
    <div className="space-y-4 max-w-[1700px] mx-auto pb-10">
      {/* 1. Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            Overview
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Material flow velocity & daily inventory reconciliation.
          </p>
        </div>

        {/* Subtle 1-Day Delay Operational Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50/80 border border-amber-200/60 text-amber-900 text-xs font-medium self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Inventory Snapshot: Closing balance as of {formatDate(initialData.latestDate)} (T-1 Delay)</span>
        </div>
      </div>

      {/* 2. Side-by-Side: Outward on Left, Inward on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Outward Tracker (Left) */}
        <div>
          <MovementTrackerCard
            type="outward"
            initialData={initialData.outward}
            initialDays={initialData.days}
            latestDate={initialData.latestDate}
            prevDate={initialData.prevDate}
          />
        </div>

        {/* Inward Tracker (Right) */}
        <div>
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
