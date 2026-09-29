import React from "react";

export function MovementSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse select-none">
      {/* Header controls skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-300 rounded" />
          <div className="h-3.5 w-64 bg-slate-200 rounded" />
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((d) => (
            <div key={d} className="h-8 w-12 bg-slate-200 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Outward & Inward Trackers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outward Section */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="space-y-1">
              <div className="h-5 w-40 bg-rose-200/70 rounded" />
              <div className="h-3 w-28 bg-slate-200 rounded" />
            </div>
            <div className="h-7 w-20 bg-rose-100 rounded-full" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-slate-50 rounded-lg border border-slate-100" />
            ))}
          </div>
        </div>

        {/* Inward Section */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="space-y-1">
              <div className="h-5 w-40 bg-emerald-200/70 rounded" />
              <div className="h-3 w-28 bg-slate-200 rounded" />
            </div>
            <div className="h-7 w-20 bg-emerald-100 rounded-full" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-slate-50 rounded-lg border border-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
