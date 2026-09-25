import { LayoutDashboard } from "lucide-react";

export default function OverviewPage() {
  return (
    <div className="space-y-4 max-w-[1500px] mx-auto">
      <div>
        <h1 className="text-base font-bold text-slate-900 tracking-tight">Overview</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Workspace overview and executive summary dashboard.
        </p>
      </div>

      <div className="min-h-[460px] rounded-lg border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <LayoutDashboard className="w-5 h-5 text-slate-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700">Overview Workspace</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          This space is currently blank and reserved for custom executive KPI widgets and operational summaries.
        </p>
      </div>
    </div>
  );
}
