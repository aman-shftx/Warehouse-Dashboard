import { supabaseAdmin } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/utils";
import Link from "next/link";
import { TrendingUp, Layers, Zap, ArrowRight } from "lucide-react";

export const revalidate = 60;

export default async function AnalyticsPage() {
  const { data: drrData } = await supabaseAdmin
    .from("v_daily_run_rate")
    .select("*")
    .order("drr_7d", { ascending: false })
    .limit(50);

  const topDrrItems = drrData || [];

  const { data: stockItems } = await supabaseAdmin
    .from("v_current_stock")
    .select("*");

  const items = stockItems || [];

  const catSummary = new Map<string, { count: number; stock: number }>();
  const sourcingSummary = new Map<string, { count: number; stock: number }>();

  items.forEach((item) => {
    const cat = item.category || "Unassigned";
    const src = item.sourcing || "OTHER";
    const st = item.current_stock || 0;

    const cObj = catSummary.get(cat) || { count: 0, stock: 0 };
    cObj.count++;
    cObj.stock += st;
    catSummary.set(cat, cObj);

    const sObj = sourcingSummary.get(src) || { count: 0, stock: 0 };
    sObj.count++;
    sObj.stock += st;
    sourcingSummary.set(src, sObj);
  });

  return (
    <div className="space-y-4 max-w-[1500px] mx-auto">
      <div>
        <h1 className="text-base font-bold text-slate-900 tracking-tight">Inventory & DRR Analytics</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          High-velocity SKUs and Daily Run Rates computed directly from 18,733 outward dispatch events.
        </p>
      </div>

      {/* Sourcing & Category Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Sourcing Breakdown */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/80">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-600">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Sourcing Channel Breakdown</h3>
          </div>
          <div className="space-y-1.5">
            {Array.from(sourcingSummary.entries()).map(([src, val]) => (
              <div key={src} className="flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-100/80 text-xs">
                <div>
                  <span className="font-semibold text-slate-800 text-[12px]">{src}</span>
                  <span className="text-[11px] text-slate-400 ml-2">({val.count} SKUs)</span>
                </div>
                <div className="text-right font-mono tabular-nums font-semibold text-slate-900 text-xs">
                  {formatNumber(val.stock)} <span className="text-[10px] font-normal text-slate-400">units</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/80">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-600">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Top Product Families</h3>
          </div>
          <div className="space-y-1.5">
            {Array.from(catSummary.entries())
              .sort((a, b) => b[1].stock - a[1].stock)
              .slice(0, 5)
              .map(([cat, val]) => (
                <div key={cat} className="flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-100/80 text-xs">
                  <div>
                    <span className="font-semibold text-slate-800 text-[12px]">{cat}</span>
                    <span className="text-[11px] text-slate-400 ml-2">({val.count} SKUs)</span>
                  </div>
                  <div className="text-right font-mono tabular-nums font-semibold text-slate-900 text-xs">
                    {formatNumber(val.stock)} <span className="text-[10px] font-normal text-slate-400">units</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Top 50 by DRR Table - Rule: Density, tabular figures, right-aligned numbers */}
      <div className="bg-white rounded-lg border border-slate-200/80 overflow-hidden flex flex-col">
        <div className="p-3 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Top 50 SKUs by Daily Run Rate (7D)</h3>
              <p className="text-[11px] text-slate-400">Average daily consumption calculated from actual outward dispatches</p>
            </div>
          </div>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {topDrrItems.length} Products
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/95 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 sticky top-0">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">SKU Code</th>
                <th className="py-2.5 px-3">Product Title</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Sourcing</th>
                <th className="py-2.5 px-3 text-right">7D Outward</th>
                <th className="py-2.5 px-3 text-right">Daily Run Rate</th>
                <th className="py-2.5 px-3 text-right">Current Stock</th>
                <th className="py-2.5 px-3 text-center">Days of Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px] leading-5 text-slate-700">
              {topDrrItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                    No run rate data available yet.
                  </td>
                </tr>
              ) : (
                topDrrItems.map((item, index) => {
                  const daysCover = item.drr_7d > 0
                    ? Math.round(item.current_stock / item.drr_7d)
                    : null;

                  return (
                    <tr key={item.sku_code} className="hover:bg-slate-50/80 transition-colors duration-100">
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-400">#{index + 1}</td>
                      <td className="py-2 px-3 font-mono text-[12px] font-semibold text-slate-900 whitespace-nowrap">
                        <Link href={`/product/${encodeURIComponent(item.sku_code)}`} className="hover:text-indigo-600 hover:underline">
                          {item.sku_code}
                        </Link>
                      </td>
                      <td className="py-2 px-3 max-w-xs truncate font-medium text-slate-800" title={item.product_name || ""}>
                        {item.product_name || "-"}
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-xs whitespace-nowrap">{item.category || "-"}</td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200/60">
                          {item.sourcing || "-"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 text-xs">
                        {formatNumber(item.outward_7d)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-indigo-600 text-xs">
                        {item.drr_7d} <span className="font-normal text-[10px] text-slate-400">/day</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-800 text-xs">
                        {formatNumber(item.current_stock)}
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        {daysCover !== null ? (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                              daysCover <= 3
                                ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                                : daysCover <= 7
                                ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {daysCover} days
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
