import React from "react";

export function OverviewSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse select-none">
      {/* Top Banner / Sync Info Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-100/80 rounded-xl p-4 border border-slate-200/70">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-slate-300 rounded" />
          <div className="h-3.5 w-72 bg-slate-200 rounded" />
        </div>
        <div className="h-9 w-32 bg-slate-300 rounded-lg" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-24 bg-slate-200 rounded" />
              <div className="w-8 h-8 rounded-lg bg-slate-100" />
            </div>
            <div className="h-7 w-32 bg-slate-300 rounded" />
            <div className="h-3 w-40 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Health Distribution & Risk Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-4 w-40 bg-slate-300 rounded" />
            <div className="h-4 w-20 bg-slate-200 rounded" />
          </div>
          <div className="h-64 w-full bg-slate-100/70 rounded-lg flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="h-4 w-32 bg-slate-300 rounded" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="h-10 bg-slate-50 rounded-lg border border-slate-100" />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Table Placeholder */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 w-48 bg-slate-300 rounded" />
          <div className="h-7 w-28 bg-slate-100 rounded" />
        </div>
        <div className="space-y-2 pt-1">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="h-12 bg-slate-50 rounded-lg border border-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
