import { supabaseAdmin } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/utils";
import Link from "next/link";
import { AlertTriangle, AlertOctagon, ShoppingCart, ArrowRight } from "lucide-react";

export const revalidate = 60;

export default async function AlertsPage() {
  const { data: stockItems } = await supabaseAdmin
    .from("v_current_stock")
    .select("*");

  const items = stockItems || [];

  // Reorder Required: stock < required_qty (where required_qty > 0)
  const reorderList = items
    .filter((item) => item.required_qty > 0 && item.current_stock < item.required_qty)
    .map((item) => ({
      ...item,
      deficit: item.required_qty - item.current_stock,
    }))
    .sort((a, b) => b.deficit - a.deficit);

  // Out of stock: current_stock === 0
  const outOfStockList = items
    .filter((item) => item.current_stock === 0)
    .sort((a, b) => (b.required_qty || 0) - (a.required_qty || 0));

  const totalDeficitUnits = reorderList.reduce((sum, item) => sum + item.deficit, 0);

  return (
    <div className="space-y-4 max-w-[1500px] mx-auto">
      <div>
        <h1 className="text-base font-bold text-slate-900 tracking-tight">Sourcing & Reorder Alerts</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Procurement schedule based on target stock requirements defined in the SKU catalog.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Out of Stock SKUs</div>
            <div className="text-xl font-bold tabular-nums text-rose-700 mt-0.5">{outOfStockList.length}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Zero physical inventory available</p>
          </div>
          <div className="p-2 rounded-md bg-rose-50 text-rose-600">
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Reorder Required</div>
            <div className="text-xl font-bold tabular-nums text-amber-700 mt-0.5">{reorderList.length} SKUs</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Stock below declared target</p>
          </div>
          <div className="p-2 rounded-md bg-amber-50 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Deficit Units</div>
            <div className="text-xl font-bold tabular-nums text-indigo-700 mt-0.5">{formatNumber(totalDeficitUnits)}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Units required to reach targets</p>
          </div>
          <div className="p-2 rounded-md bg-indigo-50 text-indigo-600">
            <ShoppingCart className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Sourcing Deficit Schedule Table */}
      <div className="bg-white rounded-lg border border-slate-200/80 overflow-hidden flex flex-col">
        <div className="p-3 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-amber-50 text-amber-600">
              <ShoppingCart className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Sourcing Deficit & Reorder Schedule</h3>
              <p className="text-[11px] text-slate-400">Ranked by highest deficit quantity</p>
            </div>
          </div>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {reorderList.length} Action Items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/95 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 sticky top-0">
              <tr>
                <th className="py-2.5 px-3">SKU Code</th>
                <th className="py-2.5 px-3">Product Title</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Sourcing</th>
                <th className="py-2.5 px-3 text-right">Current Stock</th>
                <th className="py-2.5 px-3 text-right">Target Requirement</th>
                <th className="py-2.5 px-3 text-right">Order Deficit</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px] leading-5 text-slate-700">
              {reorderList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    No products currently require reordering. All inventory levels meet or exceed targets.
                  </td>
                </tr>
              ) : (
                reorderList.map((item) => (
                  <tr key={item.sku_code} className="hover:bg-slate-50/80 transition-colors duration-100">
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
                        {item.sourcing || "MARKET"}
                      </span>
                    </td>
                    <td className={`py-2 px-3 text-right font-mono tabular-nums font-semibold text-xs ${item.current_stock === 0 ? "text-rose-700 font-bold" : "text-amber-800 font-semibold"}`}>
                      {formatNumber(item.current_stock)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-xs text-slate-500">
                      {formatNumber(item.required_qty)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-xs text-rose-700">
                      +{formatNumber(item.deficit)}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <Link
                        href={`/product/${encodeURIComponent(item.sku_code)}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-indigo-600 transition-colors p-1"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
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
