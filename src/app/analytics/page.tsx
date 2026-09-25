import { supabaseAdmin } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/utils";
import Link from "next/link";
import { TrendingUp, Layers, ArrowUpRight, Zap, AlertCircle } from "lucide-react";

export const revalidate = 60;

export default async function AnalyticsPage() {
  // 1. Fetch DRR view (or calculate dynamically if view not ready)
  const { data: drrData } = await supabaseAdmin
    .from("v_daily_run_rate")
    .select("*")
    .order("drr_7d", { ascending: false })
    .limit(50);

  const topDrrItems = drrData || [];

  // 2. Fetch current stock to calculate inventory velocity
  const { data: stockItems } = await supabaseAdmin
    .from("v_current_stock")
    .select("*");

  const items = stockItems || [];

  // Group by category
  const catSummary = new Map<string, { count: number; stock: number }>();
  // Group by sourcing
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Inventory & DRR Analytics</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          High-velocity SKUs, Daily Run Rates calculated from outward dispatches, and sourcing distribution.
        </p>
      </div>

      {/* Sourcing & Category Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sourcing Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Sourcing Breakdown</h3>
          </div>
          <div className="space-y-3">
            {Array.from(sourcingSummary.entries()).map(([src, val]) => (
              <div key={src} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="font-bold text-slate-800">{src}</span>
                  <div className="text-[11px] text-slate-400">{val.count} unique SKUs</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{formatNumber(val.stock)} units</div>
                  <div className="text-[10px] text-slate-400">Total in stock</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Top Categories by Stock</h3>
          </div>
          <div className="space-y-3">
            {Array.from(catSummary.entries())
              .sort((a, b) => b[1].stock - a[1].stock)
              .slice(0, 5)
              .map(([cat, val]) => (
                <div key={cat} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{cat}</span>
                    <div className="text-[11px] text-slate-400">{val.count} SKUs</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{formatNumber(val.stock)} units</div>
                    <div className="text-[10px] text-slate-400">Total in stock</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Top 50 by DRR Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Top 50 SKUs by Daily Run Rate (7D)</h3>
              <p className="text-[11px] text-slate-500">Based on actual outward dispatches over the last 7 days</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-100 text-indigo-700">
            {topDrrItems.length} Products
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">SKU Code</th>
                <th className="p-3">Product Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Sourcing</th>
                <th className="p-3 text-right">7D Outward</th>
                <th className="p-3 text-right">Daily Run Rate (DRR)</th>
                <th className="p-3 text-right">Current Stock</th>
                <th className="p-3 text-center">Days of Inventory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {topDrrItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No run rate data found. Run sync to calculate DRR from outward dispatches.
                  </td>
                </tr>
              ) : (
                topDrrItems.map((item, index) => {
                  const daysCover = item.drr_7d > 0
                    ? Math.round(item.current_stock / item.drr_7d)
                    : null;

                  return (
                    <tr key={item.sku_code} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-400">#{index + 1}</td>
                      <td className="p-3 font-mono font-semibold text-indigo-600">
                        <Link href={`/product/${encodeURIComponent(item.sku_code)}`} className="hover:underline">
                          {item.sku_code}
                        </Link>
                      </td>
                      <td className="p-3 max-w-xs truncate font-medium text-slate-900" title={item.product_name || ""}>
                        {item.product_name || "-"}
                      </td>
                      <td className="p-3 text-slate-600">{item.category || "-"}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {item.sourcing || "-"}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-amber-600">
                        {formatNumber(item.outward_7d)}
                      </td>
                      <td className="p-3 text-right font-bold text-indigo-600">
                        {item.drr_7d} / day
                      </td>
                      <td className="p-3 text-right font-semibold text-slate-800">
                        {formatNumber(item.current_stock)}
                      </td>
                      <td className="p-3 text-center">
                        {daysCover !== null ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              daysCover <= 3
                                ? "bg-rose-100 text-rose-800"
                                : daysCover <= 7
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {daysCover} days
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
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
