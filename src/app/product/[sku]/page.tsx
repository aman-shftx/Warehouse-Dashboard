import { supabaseAdmin } from "@/lib/supabase/server";
import { StockChart } from "@/components/dashboard/StockChart";
import { formatNumber, formatDate, cn } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  AlertTriangle,
  Clock,
  ShieldCheck,
  PackageX
} from "lucide-react";
import { notFound } from "next/navigation";
import { ProductBackButton } from "@/components/dashboard/ProductBackButton";

import { unstable_cache } from "next/cache";

export const revalidate = 60;

interface Props {
  params: {
    sku: string;
  };
}

const getCachedProductData = (sku: string) =>
  unstable_cache(
    async () => {
      const [
        { data: product },
        { data: stockHistory }
      ] = await Promise.all([
        supabaseAdmin
          .from("products")
          .select("*")
          .eq("sku_code", sku)
          .maybeSingle(),
        supabaseAdmin
          .from("daily_stock")
          .select("date, quantity")
          .eq("sku_code", sku)
          .order("date", { ascending: true })
      ]);
      return { product, stockHistory };
    },
    [`product-data-${sku}`],
    {
      tags: ["product-catalog", `product-${sku}`],
      revalidate: 3600,
    }
  )();

export default async function ProductDetailPage({ params }: Props) {
  const decodedSku = decodeURIComponent(params.sku);

  // 1. Fetch product master info and daily stock history from tagged cache
  const { product, stockHistory } = await getCachedProductData(decodedSku);

  if (!product) {
    notFound();
  }

  const currentStock = stockHistory && stockHistory.length > 0
    ? stockHistory[stockHistory.length - 1].quantity
    : 0;

  // 2. Define 30-day calendar date array ending on Today
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const past30Days: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    past30Days.push(dStr);
  }

  const d30Start = `${past30Days[29]}T00:00:00.000Z`;
  const todayEnd = `${todayStr}T23:59:59.999Z`;

  const skuFilter = product.old_sku_code
    ? `sku_code.eq.${decodedSku},sku_code.eq.${product.old_sku_code}`
    : `sku_code.eq.${decodedSku}`;

  // 3. Fetch inward history, outward history, and 30D outward concurrently in a single roundtrip
  const [
    { data: inwardHistory },
    { data: outwardHistory },
    { data: outward30d }
  ] = await Promise.all([
    supabaseAdmin
      .from("inward_transactions")
      .select("*")
      .or(skuFilter)
      .order("date", { ascending: false })
      .limit(30),
    supabaseAdmin
      .from("outward_transactions")
      .select("*")
      .or(skuFilter)
      .order("date", { ascending: false })
      .limit(30),
    supabaseAdmin
      .from("outward_transactions")
      .select("quantity, date")
      .or(skuFilter)
      .gte("date", d30Start)
      .lte("date", todayEnd)
  ]);

  const dateToDayIndex = new Map<string, number>();
  past30Days.forEach((dStr, idx) => dateToDayIndex.set(dStr, idx));
  const dailyArr = new Array(30).fill(0);

  (outward30d || []).forEach((row) => {
    const q = row.quantity || 0;
    const dayStr = row.date.substring(0, 10);
    const dayIdx = dateToDayIndex.get(dayStr);
    if (dayIdx !== undefined && dayIdx >= 0 && dayIdx < 30) {
      dailyArr[dayIdx] += q;
    }
  });

  const out7 = dailyArr.slice(0, 7).reduce((a, b) => a + b, 0);
  const out14 = dailyArr.slice(0, 14).reduce((a, b) => a + b, 0);
  const out30 = dailyArr.slice(0, 30).reduce((a, b) => a + b, 0);

  const drr7d = parseFloat((out7 / 7.0).toFixed(2));
  const drr14d = parseFloat((out14 / 14.0).toFixed(2));
  const drr30d = parseFloat((out30 / 30.0).toFixed(2));

  let daysOfStock = 999;
  if (drr14d > 0) {
    daysOfStock = parseFloat((currentStock / drr14d).toFixed(1));
  } else if (drr7d > 0) {
    daysOfStock = parseFloat((currentStock / drr7d).toFixed(1));
  } else if (drr30d > 0) {
    daysOfStock = parseFloat((currentStock / drr30d).toFixed(1));
  }

  let accelPct = 0;
  let demandTrend: "ACCELERATING" | "STABLE" | "DECLINING" = "STABLE";
  if (drr30d > 0) {
    accelPct = parseFloat((((drr7d - drr30d) / drr30d) * 100).toFixed(1));
    if (drr7d > drr30d * 1.15) demandTrend = "ACCELERATING";
    else if (drr7d < drr30d * 0.85) demandTrend = "DECLINING";
  } else if (drr7d > 0) {
    accelPct = 100;
    demandTrend = "ACCELERATING";
  }

  const isReorder = (product.required_qty || 0) > 0 && currentStock < (product.required_qty || 0);
  const deficit = Math.max(0, (product.required_qty || 0) - currentStock);

  let statusBadge = {
    label: "HEALTHY",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200/60"
  };

  if (currentStock === 0) {
    statusBadge = { label: "OUT OF STOCK", color: "bg-rose-50 text-rose-700 border-rose-200/60" };
  } else if (daysOfStock < 7) {
    statusBadge = { label: "CRITICAL COVER", color: "bg-amber-50 text-amber-700 border-amber-200/60" };
  } else if (isReorder) {
    statusBadge = { label: "REORDER NEEDED", color: "bg-yellow-50 text-yellow-700 border-yellow-200/60" };
  } else if (currentStock > 0 && out30 === 0) {
    statusBadge = { label: "DEAD STOCK", color: "bg-slate-100 text-slate-700 border-slate-200/60" };
  } else if (daysOfStock > 60) {
    statusBadge = { label: "EXCESS BUFFER", color: "bg-indigo-50 text-indigo-700 border-indigo-200/60" };
  }

  return (
    <div className="space-y-4 max-w-[1700px] mx-auto pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <ProductBackButton fallbackHref="/inventory" label="Back" />
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="font-mono text-slate-700 font-semibold">{product.sku_code}</span>
      </div>

      {/* Header Info Card */}
      <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
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
            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border uppercase", statusBadge.color)}>
              {statusBadge.label}
            </span>
          </div>

          <h1 className="text-base font-bold text-slate-900 tracking-tight">{product.product_name || "Unnamed Product"}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Brand: <strong className="text-slate-800 font-medium">{product.brand || "N/A"}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Category: <strong className="text-slate-800 font-medium">{product.category || "Unassigned"}</strong></span>
          </div>
        </div>

        {/* Intelligence Metric Blocks */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50/70 p-3 rounded-md border border-slate-200/80 shrink-0">
          {/* Current Stock */}
          <div className="text-center px-2">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Current Stock</div>
            <div className={`text-xl font-bold font-mono tabular-nums ${currentStock === 0 ? "text-rose-600" : "text-slate-900"}`}>
              {formatNumber(currentStock)}
            </div>
            <span className="text-[10px] text-slate-400 font-sans">units</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />

          {/* 7D DRR */}
          <div className="text-center px-2">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">7D DRR</div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-700">
              {drr7d}
            </div>
            <span className="text-[10px] text-slate-400 font-sans">units/day</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />

          {/* 14D DRR Standard */}
          <div className="text-center px-2">
            <div className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wider">14D DRR (Std)</div>
            <div className="text-xl font-bold font-mono tabular-nums text-indigo-700">
              {drr14d}
            </div>
            <span className="text-[10px] text-indigo-600 font-sans">baseline</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />

          {/* 30D DRR */}
          <div className="text-center px-2">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">30D DRR</div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-700">
              {drr30d}
            </div>
            <span className="text-[10px] text-slate-400 font-sans">units/day</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />

          {/* Days of Stock Cover */}
          <div className="text-center px-2">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Stock Cover</div>
            <div className={cn(
              "text-xl font-bold font-mono tabular-nums",
              currentStock === 0 ? "text-rose-600" : daysOfStock < 7 ? "text-amber-700" : "text-slate-900"
            )}>
              {currentStock === 0 ? "0d" : daysOfStock >= 999 ? "∞" : `${daysOfStock}d`}
            </div>
            <span className="text-[10px] text-slate-400 font-sans">
              {daysOfStock >= 999 ? "No Demand" : "Est. runway"}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200" />

          {/* Demand Trend */}
          <div className="text-center px-2">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Acceleration</div>
            <div className="text-sm font-bold font-mono tabular-nums mt-0.5">
              {demandTrend === "ACCELERATING" ? (
                <span className="text-emerald-700 flex items-center justify-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +{accelPct}%
                </span>
              ) : demandTrend === "DECLINING" ? (
                <span className="text-rose-700 flex items-center justify-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" /> {accelPct}%
                </span>
              ) : (
                <span className="text-slate-500 font-medium">STABLE</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-sans">7D vs 30D</span>
          </div>
        </div>
      </div>

      {/* Target & Deficit Action Banner if Reorder Required */}
      {isReorder && (
        <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold text-amber-900">
              Procurement Alert: Current stock ({formatNumber(currentStock)}) is below target requirement ({formatNumber(product.required_qty)}).
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
              Deficit: +{formatNumber(deficit)} units
            </span>
            <Link
              href="/alerts?filter=reorder"
              className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline ml-2"
            >
              View in Reorder Schedule →
            </Link>
          </div>
        </div>
      )}

      {/* Stock History Chart */}
      <StockChart
        data={stockHistory || []}
        title={`Inventory Level History: ${product.sku_code}`}
        subtitle={`Recorded daily closing stock counts over ${stockHistory?.length || 0} dates`}
      />

      {/* Inward & Outward Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Inward */}
        <div className="bg-white rounded-lg border border-slate-200/90 overflow-hidden flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="p-3 border-b border-slate-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200/60">
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
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-600 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Inward Qty</th>
                  <th className="py-2.5 px-3">Reference / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[12px] leading-5 text-slate-700">
                {(inwardHistory || []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-xs text-slate-400">
                      No inward shipment records found.
                    </td>
                  </tr>
                ) : (
                  (inwardHistory || []).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors duration-100 h-9">
                      <td className="py-2 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">{formatDate(row.date)}</td>
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
        <div className="bg-white rounded-lg border border-slate-200/90 overflow-hidden flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="p-3 border-b border-slate-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-rose-50 text-rose-600 border border-rose-200/60">
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
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-600 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Outward Qty</th>
                  <th className="py-2.5 px-3">Gatepass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[12px] leading-5 text-slate-700">
                {(outwardHistory || []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-xs text-slate-400">
                      No outward dispatch records found.
                    </td>
                  </tr>
                ) : (
                  (outwardHistory || []).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors duration-100 h-9">
                      <td className="py-2 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">{formatDate(row.date)}</td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-rose-700 text-xs whitespace-nowrap">
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
