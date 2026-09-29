"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Layers,
  BarChart3
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { ExecutiveOverviewData, POIssuedRecord, EnrichedSKUItem } from "@/types";
import { formatNumber, formatDate, cn } from "@/lib/utils";
import { calculateAlertsMetrics, getTargetQty, getCoverDays30D } from "@/lib/alerts-engine";

interface Props {
  data: ExecutiveOverviewData;
}

export function ExecutiveOverviewDashboard({ data }: Props) {
  const { stats, items, sourcingBreakdown, macroTrend, sourcingActionQueue, alertsState: initialAlertsState } = data;

  // Single Source of Truth for Alerts (syncs directly with Alerts & Reorders tab)
  const [ignoredSKUs, setIgnoredSKUs] = useState<Set<string>>(
    () => new Set(initialAlertsState?.ignored || [])
  );
  const [poIssuedRecords, setPoIssuedRecords] = useState<Record<string, POIssuedRecord>>(
    () => initialAlertsState?.poIssued || {}
  );

  useEffect(() => {
    // 1. Check local storage cache for instant update
    try {
      const cached = localStorage.getItem("warehouse_alerts_actions_v1");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.ignored)) setIgnoredSKUs(new Set(parsed.ignored));
        if (typeof parsed.poIssued === "object" && parsed.poIssued !== null) {
          setPoIssuedRecords(parsed.poIssued);
        }
      }
    } catch (e) {}

    // 2. Fetch latest backend state to guarantee persistence across devices/navigation
    fetch("/api/alerts-actions")
      .then((res) => res.json())
      .then((fresh) => {
        if (fresh && !fresh.error) {
          if (Array.isArray(fresh.ignored)) setIgnoredSKUs(new Set(fresh.ignored));
          if (typeof fresh.poIssued === "object" && fresh.poIssued !== null) {
            setPoIssuedRecords(fresh.poIssued);
          }
          try {
            localStorage.setItem("warehouse_alerts_actions_v1", JSON.stringify(fresh));
          } catch (e) {}
        }
      })
      .catch((err) => console.error("Error syncing alerts state:", err));
  }, []);

  // Live alert metrics calculated directly using the identical alert & reorder engine
  const alertsMetrics = useMemo(() => {
    return calculateAlertsMetrics(items, ignoredSKUs, poIssuedRecords);
  }, [items, ignoredSKUs, poIssuedRecords]);

  // Sourcing Action Queue: Derived directly from Alert & Reorder data (single source of truth)
  const sourcingActionList = useMemo(() => {
    const combinedMap = new Map<string, EnrichedSKUItem>();

    // 1. Stockout items (urgent priority)
    alertsMetrics.outOfStockList.forEach((item) => {
      combinedMap.set(item.sku_code, item);
    });

    // 2. Reorder items (< 30 days cover, includes < 15 days critical)
    alertsMetrics.reorderRequiredList.forEach((item) => {
      combinedMap.set(item.sku_code, item);
    });

    // Sort: Stockouts & Critical (<15d) first, then by Order Required descending
    return Array.from(combinedMap.values()).sort((a, b) => {
      const aOOS = a.current_stock === 0;
      const bOOS = b.current_stock === 0;
      if (aOOS !== bOOS) return aOOS ? -1 : 1;

      const aCover = getCoverDays30D(a);
      const bCover = getCoverDays30D(b);
      const aCritical = aCover < 15;
      const bCritical = bCover < 15;
      if (aCritical !== bCritical) return aCritical ? -1 : 1;

      const aOrderReq = getTargetQty(a);
      const bOrderReq = getTargetQty(b);
      if (bOrderReq !== aOrderReq) return bOrderReq - aOrderReq;

      return (b.drr_30d || 0) - (a.drr_30d || 0);
    });
  }, [alertsMetrics]);

  // Compute 30D stock net change
  const stockChange30d = useMemo(() => {
    if (!macroTrend || macroTrend.length < 2) return 0;
    const first = macroTrend[0].quantity;
    const last = macroTrend[macroTrend.length - 1].quantity;
    return last - first;
  }, [macroTrend]);

  // Top 8 Velocity Movers
  const topVelocityMovers = useMemo(() => {
    return [...items]
      .filter((i) => i.drr_7d > 0)
      .sort((a, b) => b.drr_7d - a.drr_7d)
      .slice(0, 8);
  }, [items]);

  // Format date helper for charts (e.g. "29 Aug", "15 Sep")
  const formatChartDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length < 3) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const m = parseInt(parts[1], 10) - 1;
    return `${parts[2]} ${months[m] || ""}`;
  };

  return (
    <div className="space-y-4 max-w-[1700px] mx-auto pb-12">
      {/* 1. Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-950 tracking-tight">
            Warehouse Overview
          </h1>
        </div>

        {/* Operational Status Badges */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-800 text-xs font-medium shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span>As of {formatDate(stats.latestStockDate)}</span>
          </div>
        </div>
      </div>

      {/* 2. FIVE MASTER CLICKABLE DECISION KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total SKUs & Warehouse Stock */}
        <Link
          href="/inventory"
          className="group bg-white rounded-lg border border-slate-200/90 p-4 hover:border-slate-400 hover:shadow-2xs transition-all flex flex-col justify-between relative overflow-hidden"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Total SKUs & Stock
            </span>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold font-mono tracking-tight text-slate-950 leading-none">
                  {formatNumber(stats.totalSKUs)}
                </span>
                <span className="text-sm font-bold text-slate-700 uppercase">SKUs</span>
              </div>
              <div className="text-sm font-mono text-slate-800 mt-1.5">
                <strong className="text-slate-950 font-bold">{formatNumber(stats.totalWarehouseStock)}</strong> units on hand
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-700 font-medium">Avg Cover: ~{stats.avgDaysOfStock}d</span>
            <span className="text-slate-900 font-bold group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all flex items-center gap-1">
              Catalog <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        {/* Card 2: Need to Reorder */}
        <Link
          href="/alerts?filter=reorder"
          className="group bg-amber-50/15 rounded-lg border border-amber-200/90 p-4 hover:border-amber-400 hover:shadow-2xs transition-all flex flex-col justify-between relative overflow-hidden"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-950">
              Need to Reorder
            </span>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold font-mono tracking-tight text-amber-950 leading-none">
                  {formatNumber(alertsMetrics.reorderCount)}
                </span>
                <span className="text-sm font-bold text-amber-900 uppercase">SKUs</span>
              </div>
              <div className="text-sm font-mono text-slate-800 mt-1.5">
                Deficit: <strong className="text-amber-800 font-bold">+{formatNumber(alertsMetrics.totalReorderDeficitUnits)}</strong> units
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-amber-100/80 flex items-center justify-between text-xs">
            <span className="text-amber-900 font-semibold">Cover &lt; 30d</span>
            <span className="text-amber-950 font-bold group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all flex items-center gap-1">
              Reorder Schedule <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        {/* Card 3: Out of Stock */}
        <Link
          href="/alerts?filter=out_of_stock"
          className="group bg-rose-50/15 rounded-lg border border-rose-200/90 p-4 hover:border-rose-400 hover:shadow-2xs transition-all flex flex-col justify-between relative overflow-hidden"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-950">
              Out of Stock
            </span>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold font-mono tracking-tight text-rose-700 leading-none">
                  {formatNumber(alertsMetrics.oosCount)}
                </span>
                <span className="text-sm font-bold text-rose-900 uppercase">SKUs</span>
              </div>
              <div className="text-sm font-mono text-rose-900 mt-1.5 font-medium">
                Zero physical stock on-hand
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-rose-100/80 flex items-center justify-between text-xs">
            <span className="text-rose-900 font-semibold">Active Alerts</span>
            <span className="text-rose-950 font-bold group-hover:text-rose-700 group-hover:translate-x-0.5 transition-all flex items-center gap-1">
              OOS Items <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        {/* Card 4: Material Outward (Yesterday) */}
        <Link
          href="/movement?type=outward"
          className="group bg-white rounded-lg border border-slate-200/90 p-4 hover:border-slate-400 hover:shadow-2xs transition-all flex flex-col justify-between relative overflow-hidden"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Material Outward
            </span>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold font-mono tracking-tight text-slate-950 leading-none">
                  {formatNumber(stats.outwardYesterdaySkus)}
                </span>
                <span className="text-sm font-bold text-slate-700 uppercase">SKUs</span>
              </div>
              <div className="text-sm font-mono text-slate-800 mt-1.5">
                Dispatched: <strong className="text-rose-700 font-bold">-{formatNumber(stats.outwardYesterdayQty)}</strong> units
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-mono">As of {formatDate(stats.latestOutwardDate)}</span>
            <span className="text-slate-900 font-bold group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all flex items-center gap-1">
              Tracker <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        {/* Card 5: Material Inward (Yesterday) */}
        <Link
          href="/movement?type=inward"
          className="group bg-emerald-50/15 rounded-lg border border-emerald-200/90 p-4 hover:border-emerald-400 hover:shadow-2xs transition-all flex flex-col justify-between relative overflow-hidden"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-950">
              Material Inward
            </span>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold font-mono tracking-tight text-emerald-950 leading-none">
                  {formatNumber(stats.inwardYesterdaySkus)}
                </span>
                <span className="text-sm font-bold text-emerald-900 uppercase">SKUs</span>
              </div>
              <div className="text-sm font-mono text-slate-800 mt-1.5">
                Received: <strong className="text-emerald-700 font-bold">+{formatNumber(stats.inwardYesterdayQty)}</strong> units
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-emerald-100/80 flex items-center justify-between text-xs">
            <span className="text-emerald-900 font-mono font-semibold">Net: {stats.netMovementYesterday >= 0 ? "+" : ""}{formatNumber(stats.netMovementYesterday)}u</span>
            <span className="text-emerald-950 font-bold group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all flex items-center gap-1">
              Tracker <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>
      </div>

      {/* 2.5 Daily Operational Pulse Strip */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-3.5 flex flex-wrap items-center justify-between gap-3 text-sm shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-950" />
          <span className="font-bold uppercase tracking-wider text-slate-950 text-xs">
            Daily Operational Pulse:
          </span>
          <span className="text-slate-800 font-medium">
            Net flow of <strong className="font-mono text-slate-950 font-bold">
              {stats.netMovementYesterday >= 0 ? `+${formatNumber(stats.netMovementYesterday)}` : formatNumber(stats.netMovementYesterday)} units
            </strong> yesterday across {stats.outwardYesterdaySkus + stats.inwardYesterdaySkus} active SKUs.
          </span>
        </div>

        <div className="flex items-center gap-3.5 text-xs font-mono">
          <span className="text-slate-700 font-medium">
            Inward: <strong className="text-emerald-700 font-bold">+{formatNumber(stats.inwardYesterdayQty)}</strong> ({stats.inwardYesterdaySkus} SKUs)
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-700 font-medium">
            Outward: <strong className="text-rose-700 font-bold">-{formatNumber(stats.outwardYesterdayQty)}</strong> ({stats.outwardYesterdaySkus} SKUs)
          </span>
          <span className="text-slate-300">•</span>
          <Link
            href="/movement"
            className="text-slate-900 hover:text-indigo-600 font-sans font-bold transition-colors flex items-center gap-1"
          >
            Review Movement Trackers <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 3. MACRO STOCK TRAJECTORY & HEALTH DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* 30-Day Warehouse Stock Trajectory (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200/90 p-4 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-800" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-950">
                  30-Day Warehouse Closing Stock Trajectory
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Total aggregate physical inventory on-hand across all 358 active SKUs
              </p>
            </div>

            <div className="flex items-baseline gap-2.5">
              <div className="text-right">
                <span className="text-base font-bold font-mono text-slate-950">
                  {formatNumber(stats.totalWarehouseStock)}
                </span>
                <span className="text-xs text-slate-700 uppercase font-sans font-bold ml-1">Units</span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-300">
                {stockChange30d >= 0 ? `+${formatNumber(stockChange30d)}` : formatNumber(stockChange30d)} (30d)
              </span>
            </div>
          </div>

          {/* Clean Monochrome Area Chart */}
          <div className="h-56 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={macroTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="macroStockGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#020617" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#020617" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatChartDate}
                  tick={{ fontSize: 11, fill: "#334155" }}
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                />
                <YAxis
                  tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                  tick={{ fontSize: 11, fill: "#334155" }}
                  tickLine={false}
                  axisLine={false}
                  domain={["dataMin - 15000", "dataMax + 15000"]}
                />
                <Tooltip
                  formatter={(value: any) => [`${formatNumber(Number(value))} units`, "Closing Balance"]}
                  labelFormatter={(lbl) => formatDate(String(lbl))}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#cbd5e1",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.08)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="quantity"
                  stroke="#020617"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#macroStockGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Health & Status Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200/90 p-4 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-slate-800" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-950">
                  Inventory Health Distribution
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-800">
                {stats.totalSKUs} SKUs Evaluated
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Run-rate velocity burn speed and target coverage segmentation.
            </p>
          </div>

          {/* Visual Health Distribution Segment Bar (Proportional to 6 alert categories) */}
          <div className="my-3.5">
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100">
              <div
                style={{ width: `${items.length > 0 ? (alertsMetrics.oosCount / items.length) * 100 : 0}%` }}
                className="bg-rose-600 transition-all"
                title={`Out of Stock: ${alertsMetrics.oosCount} SKUs`}
              />
              <div
                style={{ width: `${items.length > 0 ? (alertsMetrics.criticalCount / items.length) * 100 : 0}%` }}
                className="bg-orange-500 transition-all"
                title={`Critical (<15d): ${alertsMetrics.criticalCount} SKUs`}
              />
              <div
                style={{ width: `${items.length > 0 ? (alertsMetrics.reorderCount / items.length) * 100 : 0}%` }}
                className="bg-amber-400 transition-all"
                title={`Reorder (<30d): ${alertsMetrics.reorderCount} SKUs`}
              />
              <div
                style={{ width: `${items.length > 0 ? (alertsMetrics.deadStockCount / items.length) * 100 : 0}%` }}
                className="bg-slate-400 transition-all"
                title={`Dead Stock: ${alertsMetrics.deadStockCount} SKUs`}
              />
              <div
                style={{ width: `${items.length > 0 ? (alertsMetrics.ignoredCount / items.length) * 100 : 0}%` }}
                className="bg-slate-300 transition-all"
                title={`Ignored: ${alertsMetrics.ignoredCount} SKUs`}
              />
              <div
                style={{ width: `${items.length > 0 ? (alertsMetrics.poIssuedCount / items.length) * 100 : 0}%` }}
                className="bg-indigo-500 transition-all"
                title={`PO Issued: ${alertsMetrics.poIssuedCount} SKUs`}
              />
            </div>
          </div>

          {/* Status Breakdown Grid (The 6 Alert & Replenishment Categories - Single Source of Truth) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* 1. Out of Stock */}
            <Link
              href="/alerts?filter=out_of_stock"
              className="p-3 rounded-lg bg-rose-50/20 border border-rose-200/90 hover:border-rose-400 transition-colors shadow-2xs group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-950 uppercase tracking-wider">Out of Stock</span>
                <span className="w-2 h-2 rounded-full bg-rose-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
                {alertsMetrics.oosCount}
              </div>
              <div className="text-xs text-rose-800 font-medium">0 units available</div>
            </Link>

            {/* 2. Reorder Required */}
            <Link
              href="/alerts?filter=reorder"
              className="p-3 rounded-lg bg-amber-50/20 border border-amber-200/90 hover:border-amber-400 transition-colors shadow-2xs group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">Reorder Required</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-900 mt-1">
                {alertsMetrics.reorderCount}
              </div>
              <div className="text-xs text-amber-800 font-medium">&lt;30 days cover</div>
            </Link>

            {/* 3. Critical Required */}
            <Link
              href="/alerts?filter=critical"
              className="p-3 rounded-lg bg-orange-50/20 border border-orange-200/90 hover:border-orange-400 transition-colors shadow-2xs group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-950 uppercase tracking-wider">Critical Required</span>
                <span className="w-2 h-2 rounded-full bg-orange-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-orange-800 mt-1">
                {alertsMetrics.criticalCount}
              </div>
              <div className="text-xs text-orange-800 font-medium">&lt;15 days cover</div>
            </Link>

            {/* 4. Dead Stock */}
            <Link
              href="/analytics"
              className="p-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Dead Stock</span>
                <span className="w-2 h-2 rounded-full bg-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-950 mt-1">
                {alertsMetrics.deadStockCount}
              </div>
              <div className="text-xs text-slate-700 font-medium">0 out in 30d</div>
            </Link>

            {/* 5. Ignored SKU */}
            <Link
              href="/alerts?filter=ignored"
              className="p-3 rounded-lg bg-slate-50/50 border border-slate-200 hover:border-slate-400 transition-colors shadow-2xs group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ignored SKU</span>
                <span className="w-2 h-2 rounded-full bg-slate-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-950 mt-1">
                {alertsMetrics.ignoredCount}
              </div>
              <div className="text-xs text-slate-700 font-medium">Excluded from alerts</div>
            </Link>

            {/* 6. PO Issued SKU */}
            <Link
              href="/alerts?filter=po_issued"
              className="p-3 rounded-lg bg-indigo-50/20 border border-indigo-200/90 hover:border-indigo-400 transition-colors shadow-2xs group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">PO Issued SKU</span>
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-indigo-900 mt-1">
                {alertsMetrics.poIssuedCount}
              </div>
              <div className="text-xs text-indigo-800 font-medium">PO placed by user</div>
            </Link>
          </div>
        </div>
      </div>

      {/* 4. TODAY'S SOURCING ACTION QUEUE */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
        <div className="p-3.5 border-b border-slate-200/80 bg-white flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-800">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-950">
                Today&apos;s Sourcing Action Queue
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Prioritized replenishment schedule: urgent stockouts and run-rate target deficits from Alerts & Reorder.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200">
              {sourcingActionList.length} Priority SKUs
            </span>
            <Link
              href="/alerts"
              className="text-xs font-bold text-slate-900 hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
              View Full Alerts <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-left min-w-[850px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-800 select-none">
              <tr>
                <th className="py-2.5 px-3 w-[12%]">Priority</th>
                <th className="py-2.5 px-3 w-[34%]">Product Title & SKU</th>
                <th className="py-2.5 px-3 w-[12%]">Sourcing</th>
                <th className="py-2.5 px-3 text-right w-[10%]">DRR (30D)</th>
                <th className="py-2.5 px-3 text-right w-[10%]">Current Stock</th>
                <th className="py-2.5 px-3 text-right w-[10%]">Days Cover</th>
                <th className="py-2.5 px-3 text-right w-[12%]">Order Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px] leading-5">
              {sourcingActionList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-slate-500 font-mono">
                    All inventory levels are healthy. No replenishment orders required today.
                  </td>
                </tr>
              ) : (
                sourcingActionList.slice(0, 10).map((item) => {
                  const cover = getCoverDays30D(item);
                  const orderRequired = getTargetQty(item);
                  const isOOS = item.current_stock === 0;

                  return (
                    <tr key={item.sku_code} className="hover:bg-slate-50/80 transition-colors group h-12">
                      {/* Priority Badge */}
                      <td className="py-2 px-3 overflow-hidden align-middle">
                        {isOOS ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold font-mono bg-rose-50 text-rose-900 border border-rose-200 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            CRITICAL
                          </span>
                        ) : cover < 15 ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold font-mono bg-orange-50 text-orange-950 border border-orange-200 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                            CRITICAL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold font-mono bg-amber-50 text-amber-950 border border-amber-200 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            REORDER
                          </span>
                        )}
                      </td>

                      {/* Product Name & SKU Stacked */}
                      <td className="py-2 px-3 overflow-hidden align-middle">
                        <div className="flex flex-col min-w-0">
                          <Link
                            href={`/product/${encodeURIComponent(item.sku_code)}`}
                            className="truncate block font-semibold text-slate-950 text-[13px] hover:text-indigo-600 hover:underline transition-colors leading-snug"
                            title={item.name}
                          >
                            {item.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-xs text-slate-700 font-medium">{item.sku_code}</span>
                            <span className="text-xs font-sans text-slate-600">
                              • {item.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Sourcing Channel */}
                      <td className="py-2 px-3 overflow-hidden align-middle">
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {item.sourcing || "MARKET"}
                        </span>
                      </td>

                      {/* DRR (30D) */}
                      <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono font-bold text-[13px] text-slate-950">
                        {item.drr_30d || 0}
                        <span className="text-xs font-sans font-normal text-slate-600 ml-0.5">/d</span>
                      </td>

                      {/* Current Stock */}
                      <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono text-[13px]">
                        {isOOS ? (
                          <span className="font-bold text-rose-700">0</span>
                        ) : (
                          <span className="font-bold text-slate-950">{formatNumber(item.current_stock)}</span>
                        )}
                      </td>

                      {/* Days Cover */}
                      <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono text-xs">
                        {isOOS ? (
                          <span className="text-rose-700 font-bold">0 days</span>
                        ) : cover < 15 ? (
                          <span className="font-bold text-orange-950 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                            {cover}d
                          </span>
                        ) : (
                          <span className="text-slate-800 font-semibold">
                            {cover >= 999 ? "∞" : `${cover}d`}
                          </span>
                        )}
                      </td>

                      {/* Order Required */}
                      <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono font-bold text-[13px] text-amber-950">
                        {orderRequired > 0 ? `+${formatNumber(orderRequired)}` : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. VELOCITY & SOURCING INTELLIGENCE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Left: Top Velocity Movers (7D DRR) */}
        <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-200/80 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-slate-100 text-slate-800">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-950">
                  Top High Velocity SKUs (7D DRR)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">Products consuming inventory at the fastest rate</p>
              </div>
            </div>
            <Link
              href="/analytics"
              className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors"
            >
              All 50 →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-800 select-none">
                <tr>
                  <th className="py-2.5 px-3 w-[45%]">Product & SKU</th>
                  <th className="py-2.5 px-3 text-right w-[18%]">7D DRR</th>
                  <th className="py-2.5 px-3 text-right w-[18%]">Stock</th>
                  <th className="py-2.5 px-3 text-right w-[19%]">Cover</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px] leading-5">
                {topVelocityMovers.map((item) => (
                  <tr key={item.sku_code} className="hover:bg-slate-50/80 transition-colors group h-11">
                    <td className="py-2 px-3 overflow-hidden align-middle">
                      <div className="flex flex-col min-w-0">
                        <Link
                          href={`/product/${encodeURIComponent(item.sku_code)}`}
                          className="truncate block font-semibold text-slate-950 text-[13px] hover:text-indigo-600 hover:underline transition-colors"
                          title={item.name}
                        >
                          {item.name}
                        </Link>
                        <span className="font-mono text-xs text-slate-700 font-medium truncate">{item.sku_code}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono font-bold text-slate-950 text-[13px]">
                      {item.drr_7d} <span className="text-xs font-sans font-normal text-slate-600">/d</span>
                    </td>
                    <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono font-bold text-slate-950 text-[13px]">
                      {formatNumber(item.current_stock)}
                    </td>
                    <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono text-xs">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-xs font-bold font-mono",
                          item.days_of_stock < 7
                            ? "bg-rose-50 text-rose-900 border border-rose-200"
                            : item.days_of_stock < 15
                            ? "bg-amber-50 text-amber-950 border border-amber-200"
                            : "bg-slate-100 text-slate-800 border border-slate-200"
                        )}
                      >
                        {item.days_of_stock}d
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Sourcing Channel Split & Key Categories */}
        <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-200/80 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-slate-100 text-slate-800">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-950">
                  Sourcing Channel Performance
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">Volume share, procurement pressure & stockout rates</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-800">
              {sourcingBreakdown.length} Channels
            </span>
          </div>

          <div className="p-3.5 space-y-2.5">
            {sourcingBreakdown.map((src) => {
              const stockShare = stats.totalWarehouseStock > 0
                ? Math.round((src.totalStock / stats.totalWarehouseStock) * 100)
                : 0;

              return (
                <div
                  key={src.sourcing}
                  className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-950 font-mono uppercase">
                        {src.sourcing || "MARKET"}
                      </span>
                      <span className="text-xs text-slate-700 font-semibold">
                        ({src.skuCount} SKUs • {stockShare}% volume)
                      </span>
                    </div>
                    <div className="font-mono font-bold text-xs text-slate-950">
                      {formatNumber(src.totalStock)} <span className="font-bold text-xs text-slate-700">units</span>
                    </div>
                  </div>

                  {/* Channel Progress Bar */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-2">
                    <div
                      style={{ width: `${stockShare}%` }}
                      className="h-full bg-slate-950 rounded-full"
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2.5 text-xs">
                    <div className="flex items-center gap-3 text-slate-700">
                      <span>7D Run Rate: <strong className="font-mono text-slate-950 font-bold">{src.avgDrr}u/d</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      {src.oosCount > 0 && (
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-50 text-rose-900 border border-rose-200">
                          {src.oosCount} OOS
                        </span>
                      )}
                      {src.reorderCount > 0 && (
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-50 text-amber-950 border border-amber-200">
                          {src.reorderCount} Reorders
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
