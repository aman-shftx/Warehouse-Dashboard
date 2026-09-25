import { supabaseAdmin } from "@/lib/supabase/server";
import { StockChart } from "@/components/dashboard/StockChart";
import { formatNumber, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Box, Layers, Factory } from "lucide-react";
import { notFound } from "next/navigation";

export const revalidate = 60;

interface Props {
  params: {
    sku: string;
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const decodedSku = decodeURIComponent(params.sku);

  // 1. Fetch product master info
  const { data: product } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("sku_code", decodedSku)
    .single();

  if (!product) {
    notFound();
  }

  // 2. Fetch daily stock history
  const { data: stockHistory } = await supabaseAdmin
    .from("daily_stock")
    .select("date, quantity")
    .eq("sku_code", decodedSku)
    .order("date", { ascending: true });

  // 3. Fetch inward history
  const { data: inwardHistory } = await supabaseAdmin
    .from("inward_transactions")
    .select("*")
    .or(`sku_code.eq.${decodedSku},sku_code.eq.${product.old_sku_code || decodedSku}`)
    .order("date", { ascending: false })
    .limit(20);

  // 4. Fetch outward history
  const { data: outwardHistory } = await supabaseAdmin
    .from("outward_transactions")
    .select("*")
    .or(`sku_code.eq.${decodedSku},sku_code.eq.${product.old_sku_code || decodedSku}`)
    .order("date", { ascending: false })
    .limit(20);

  const currentStock = stockHistory && stockHistory.length > 0
    ? stockHistory[stockHistory.length - 1].quantity
    : 0;

  // Compute 7-day outward total
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const outward7d = (outwardHistory || [])
    .filter((o) => new Date(o.date) >= sevenDaysAgo)
    .reduce((sum, o) => sum + (o.quantity || 0), 0);
  const drr7d = (outward7d / 7).toFixed(1);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          href="/inventory"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Inventory</span>
        </Link>
      </div>

      {/* Header Info Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">
              {product.sku_code}
            </span>
            {product.old_sku_code && (
              <span className="px-2.5 py-0.5 rounded text-xs font-medium font-mono bg-slate-100 text-slate-600">
                Old SKU: {product.old_sku_code}
              </span>
            )}
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700">
              {product.sourcing || "STANDARD"}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">{product.product_name || "Unnamed Product"}</h1>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            <span>Brand: <strong className="text-slate-700">{product.brand || "N/A"}</strong></span>
            <span>Category: <strong className="text-slate-700">{product.category || "Unassigned"}</strong></span>
          </div>
        </div>

        {/* Quick Stock Metrics */}
        <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100 shrink-0">
          <div className="text-center">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Current Stock</div>
            <div className={`text-2xl font-bold ${currentStock === 0 ? "text-rose-600" : "text-slate-900"}`}>
              {formatNumber(currentStock)}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Required Target</div>
            <div className="text-2xl font-bold text-slate-700">
              {product.required_qty ? formatNumber(product.required_qty) : "-"}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">7D DRR</div>
            <div className="text-2xl font-bold text-indigo-600">{drr7d} / day</div>
          </div>
        </div>
      </div>

      {/* Stock History Chart */}
      <StockChart
        data={stockHistory || []}
        title={`Historical Inventory Level: ${product.sku_code}`}
      />

      {/* Inward & Outward Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Inward */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Recent Inward Shipments</h3>
            </div>
            <span className="text-xs text-slate-400">{(inwardHistory || []).length} records</span>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Inward Qty</th>
                  <th className="p-3">Reference / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(inwardHistory || []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-400">
                      No inward records found.
                    </td>
                  </tr>
                ) : (
                  (inwardHistory || []).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-600">{formatDate(row.date)}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        +{formatNumber(row.quantity)}
                      </td>
                      <td className="p-3 text-slate-500 truncate max-w-[200px]">
                        {row.reference_no || row.remark || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Outward */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Recent Outward Dispatches</h3>
            </div>
            <span className="text-xs text-slate-400">{(outwardHistory || []).length} records</span>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Outward Qty</th>
                  <th className="p-3">Gatepass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(outwardHistory || []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-400">
                      No outward records found.
                    </td>
                  </tr>
                ) : (
                  (outwardHistory || []).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-600">{formatDate(row.date)}</td>
                      <td className="p-3 text-right font-bold text-amber-600">
                        -{formatNumber(row.quantity)}
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[11px] truncate max-w-[200px]">
                        {row.gatepass_no || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
