import React from "react";

export function TableSkeleton({ title = "Loading Table..." }: { title?: string }) {
  return (
    <div className="p-6 space-y-6 animate-pulse select-none">
      {/* Top Controls / Filters Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="space-y-1">
          <div className="h-5 w-48 bg-slate-300 rounded" />
          <div className="h-3.5 w-64 bg-slate-200 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-40 bg-slate-100 rounded-lg border border-slate-200/80" />
          <div className="h-9 w-24 bg-slate-100 rounded-lg border border-slate-200/80" />
        </div>
      </div>

      {/* Table rows skeleton */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="h-10 bg-slate-100/70 border-b border-slate-200/80 px-4 flex items-center justify-between">
          <div className="h-3.5 w-32 bg-slate-300 rounded" />
          <div className="h-3.5 w-24 bg-slate-200 rounded" />
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
            <div key={row} className="h-12 px-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-4 w-28 bg-slate-200 rounded" />
                <div className="h-4 w-48 bg-slate-100 rounded" />
              </div>
              <div className="flex items-center gap-6">
                <div className="h-4 w-16 bg-slate-200 rounded" />
                <div className="h-4 w-12 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
