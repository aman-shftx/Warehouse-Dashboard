import { supabaseAdmin } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/utils";
import Link from "next/link";
import { AlertTriangle, AlertOctagon, RefreshCw, ShoppingCart, ArrowRight } from "lucide-react";

export const revalidate = 60;

export default async function AlertsPage() {
  const { data: stockItems } = await supabaseAdmin
    .from("v_current_stock")
    .select("*");

  const items = stockItems || [];

  // 1. Reorder Required: stock < required_qty (where required_qty > 0)
  const reorderList = items
    .filter((item) => item.required_qty > 0 && item.current_stock < item.required_qty)
    .map((item) => ({
      ...item,
      deficit: item.required_qty - item.current_stock,
    }))
    .sort((a, b) => b.deficit - a.deficit);

  // 2. Out of stock: current_stock === 0
  const outOfStockList = items
    .filter((item) => item.current_stock === 0)
    .sort((a, b) => (b.required_qty || 0) - (a.required_qty || 0));

  // Compute total deficit
  const totalDeficitUnits = reorderList.reduce((sum, item) => sum + item.deficit, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Sourcing & Reorder Alerts</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Actionable sourcing analysis for warehouse managers and procurement teams.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white border border-rose-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-rose-600">Out of Stock SKUs</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{outOfStockList.length}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Zero physical units available</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-600">Reorder Required</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{reorderList.length} SKUs</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Below target threshold</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-indigo-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Total Unit Deficit</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(totalDeficitUnits)}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Units required to meet targets</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Reorder Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-amber-50/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Sourcing Deficit & Reorder Schedule</h3>
              <p className="text-[11px] text-slate-500">Sorted by highest deficit quantity</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-100 text-amber-800">
            {reorderList.length} Action Items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">SKU Code</th>
                <th className="p-3">Product Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Sourcing Channel</th>
                <th className="p-3 text-right">Current Stock</th>
                <th className="p-3 text-right">Target Requirement</th>
                <th className="p-3 text-right">Quantity to Order</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {reorderList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No products currently require reordering. All products are above target thresholds!
                  </td>
                </tr>
              ) : (
                reorderList.map((item) => (
                  <tr key={item.sku_code} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-indigo-700">{item.sku_code}</td>
                    <td className="p-3 max-w-xs truncate font-medium text-slate-900" title={item.product_name || ""}>
                      {item.product_name || "-"}
                    </td>
                    <td className="p-3 text-slate-600">{item.category || "-"}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {item.sourcing || "MARKET"}
                      </span>
                    </td>
                    <td className={`p-3 text-right font-bold ${item.current_stock === 0 ? "text-rose-600" : "text-amber-600"}`}>
                      {formatNumber(item.current_stock)}
                    </td>
                    <td className="p-3 text-right text-slate-600">
                      {formatNumber(item.required_qty)}
                    </td>
                    <td className="p-3 text-right font-bold text-rose-700">
                      +{formatNumber(item.deficit)}
                    </td>
                    <td className="p-3 text-center">
                      <Link
                        href={`/product/${encodeURIComponent(item.sku_code)}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Inspect SKU <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
