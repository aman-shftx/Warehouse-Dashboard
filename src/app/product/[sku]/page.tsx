import { supabaseAdmin } from "@/lib/supabase/server";
import { StockChart } from "@/components/dashboard/StockChart";
import { formatNumber, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, ChevronRight } from "lucide-react";
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
    <div className="space-y-4 max-w-[1500px] mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/inventory"
          className="inline-flex items-center gap-1 font-medium hover:text-indigo-600 transition-colors duration-100"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Inventory</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="font-mono text-slate-700 font-semibold">{product.sku_code}</span>
      </div>

      {/* Header Info Card */}
      <div className="bg-white p-4 rounded-lg border border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-indigo-50/80 text-indigo-700 border border-indigo-200/80">
              {product.sku_code}
            </span>
            {product.old_sku_code && (
              <span className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-600 border border-slate-200/60">
                Old SKU: {product.old_sku_code}
              </span>
            )}
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-slate-100 text-slate-700 border border-slate-200/60">
              {product.sourcing || "MARKET"}
            </span>
          </div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">{product.product_name || "Unnamed Product"}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Brand: <strong className="text-slate-800 font-medium">{product.brand || "N/A"}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Category: <strong className="text-slate-800 font-medium">{product.category || "Unassigned"}</strong></span>
          </div>
        </div>

        {/* Quick Stock Metrics - Linear stacked tones, tabular figures */}
        <div className="flex items-center gap-5 bg-slate-50 p-3 rounded-md border border-slate-200/80 shrink-0">
          <div className="text-center px-1">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Current Stock</div>
            <div className={`text-xl font-bold font-mono tabular-nums ${currentStock === 0 ? "text-rose-600" : "text-slate-900"}`}>
              {formatNumber(currentStock)}
            </div>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div className="text-center px-1">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Required Target</div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-700">
              {product.required_qty ? formatNumber(product.required_qty) : "-"}
            </div>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div className="text-center px-1">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">7D DRR</div>
            <div className="text-xl font-bold font-mono tabular-nums text-indigo-600">
              {drr7d} <span className="text-[10px] font-normal text-slate-400">/day</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stock History Chart */}
      <StockChart
        data={stockHistory || []}
        title={`Inventory Level History: ${product.sku_code}`}
        subtitle={`Recorded daily stock counts over ${stockHistory?.length || 0} dates`}
      />

      {/* Inward & Outward Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Inward */}
        <div className="bg-white rounded-lg border border-slate-200/80 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                <ArrowDownLeft className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Recent Inward Shipments</h3>
            </div>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/60">
              {(inwardHistory || []).length} records
            </span>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/95 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Inward Qty</th>
                  <th className="py-2.5 px-3">Reference / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px] leading-5 text-slate-700">
                {(inwardHistory || []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-xs text-slate-400">
                      No inward shipment records found.
                    </td>
                  </tr>
                ) : (
                  (inwardHistory || []).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors duration-100">
                      <td className="py-2 px-3 text-slate-600 font-mono text-[12px] whitespace-nowrap">{formatDate(row.date)}</td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-emerald-700 text-xs whitespace-nowrap">
                        +{formatNumber(row.quantity)}
                      </td>
                      <td className="py-2 px-3 text-slate-500 font-mono text-[11px] truncate max-w-[200px]" title={row.reference_no || row.remark || ""}>
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
        <div className="bg-white rounded-lg border border-slate-200/80 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-amber-50 text-amber-600 border border-amber-200/60">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Recent Outward Dispatches</h3>
            </div>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/60">
              {(outwardHistory || []).length} records
            </span>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/95 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Outward Qty</th>
                  <th className="py-2.5 px-3">Gatepass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px] leading-5 text-slate-700">
                {(outwardHistory || []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-xs text-slate-400">
                      No outward dispatch records found.
                    </td>
                  </tr>
                ) : (
                  (outwardHistory || []).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors duration-100">
                      <td className="py-2 px-3 text-slate-600 font-mono text-[12px] whitespace-nowrap">{formatDate(row.date)}</td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-amber-700 text-xs whitespace-nowrap">
                        -{formatNumber(row.quantity)}
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-mono text-[11px] truncate max-w-[200px]" title={row.gatepass_no || ""}>
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
