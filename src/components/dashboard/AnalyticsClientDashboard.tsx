"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Layers,
  Zap,
  ArrowRight,
  ArrowLeft,
  PackageX,
  ShieldCheck,
  Search,
  X,
  Download,
  AlertCircle,
  Clock,
  Filter,
  SlidersHorizontal
} from "lucide-react";
import { formatNumber, formatDate, cn } from "@/lib/utils";
import { ExecutiveOverviewData, EnrichedSKUItem } from "@/types";

interface Props {
  data: ExecutiveOverviewData;
}

export function AnalyticsClientDashboard({ data }: Props) {
  const { stats, items, sourcingBreakdown, categoryBreakdown } = data;

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<"velocity" | "excess" | "dead_stock" | "sourcing_matrix">("velocity");
  
  // Card-level filter from upper interactive KPI cards
  const [cardFilter, setCardFilter] = useState<"all" | "top_drr" | "top_trend" | "worst_drr" | "worst_trend" | "dead_stock" | "excess">("all");
  
  // Search query
  const [searchQuery, setSearchQuery] = useState("");

  // Sorting for Velocity Movers table: "14d" (default) | "7d" | "30d" | "trend" | "custom" | "stock" | "cover" | "name"
  const [velocitySortKey, setVelocitySortKey] = useState<"14d" | "7d" | "30d" | "trend" | "custom" | "stock" | "cover" | "name">("14d");
  const [velocitySortDir, setVelocitySortDir] = useState<"asc" | "desc">("desc");

  // Custom DRR Day Horizon (shows as an extra column when enabled)
  const [showCustomColumn, setShowCustomColumn] = useState<boolean>(false);
  const [customDays, setCustomDays] = useState<number>(10);
  const [customDaysInput, setCustomDaysInput] = useState<string>("10");

  // Category / Sourcing Drill-Down filter in Tab 3
  const [matrixFilter, setMatrixFilter] = useState<{
    type: "sourcing" | "category";
    value: string;
  } | null>(null);

  // Helper: compute dynamic DRR for any SKU given an arbitrary number of days
  const getDynamicDRR = (item: EnrichedSKUItem, days: number): number => {
    if (days === 14 && item.drr_14d !== undefined) return item.drr_14d;
    if (days === 7) return item.drr_7d;
    if (days === 30) return item.drr_30d;
    if (!item.trend || item.trend.length === 0) {
      return item.drr_14d || item.drr_7d || 0;
    }
    const count = Math.min(Math.max(1, days), item.trend.length);
    const sum = item.trend.slice(0, count).reduce((a, b) => a + b, 0);
    return parseFloat((sum / count).toFixed(2));
  };

  // Helper: Cover Days is strictly FIXED based on 14-day DRR standard as requested
  const getCoverDays14D = (item: EnrichedSKUItem): number => {
    if (item.drr_14d > 0) return Math.round(item.current_stock / item.drr_14d);
    if (item.drr_7d > 0) return Math.round(item.current_stock / item.drr_7d);
    if (item.drr_30d > 0) return Math.round(item.current_stock / item.drr_30d);
    return 999;
  };

  // Helper: compute dynamic outward total in the selected window
  const getDynamicOutward = (item: EnrichedSKUItem, days: number): number => {
    if (days === 14 && item.outward_14d !== undefined) return item.outward_14d;
    if (days === 7) return item.outward_7d;
    if (days === 30) return item.outward_30d;
    if (!item.trend || item.trend.length === 0) {
      return item.outward_14d || item.outward_7d || 0;
    }
    const count = Math.min(Math.max(1, days), item.trend.length);
    return item.trend.slice(0, count).reduce((a, b) => a + b, 0);
  };

  // Toggle sorting on column click
  const handleSort = (key: "14d" | "7d" | "30d" | "trend" | "custom" | "stock" | "cover" | "name") => {
    if (velocitySortKey === key) {
      setVelocitySortDir((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setVelocitySortKey(key);
      setVelocitySortDir(key === "name" ? "asc" : "desc");
    }
  };

  // Common sort comparator across tables
  const sortComparator = (a: EnrichedSKUItem, b: EnrichedSKUItem) => {
    let valA = a.drr_14d;
    let valB = b.drr_14d;
    if (velocitySortKey === "7d") {
      valA = a.drr_7d;
      valB = b.drr_7d;
    } else if (velocitySortKey === "30d") {
      valA = a.drr_30d;
      valB = b.drr_30d;
    } else if (velocitySortKey === "trend") {
      valA = a.accel_pct;
      valB = b.accel_pct;
    } else if (velocitySortKey === "custom") {
      valA = getDynamicDRR(a, customDays);
      valB = getDynamicDRR(b, customDays);
    } else if (velocitySortKey === "stock") {
      valA = a.current_stock;
      valB = b.current_stock;
    } else if (velocitySortKey === "cover") {
      valA = getCoverDays14D(a);
      valB = getCoverDays14D(b);
    } else if (velocitySortKey === "name") {
      return velocitySortDir === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    return velocitySortDir === "desc" ? valB - valA : valA - valB;
  };

  // Top Velocity Movers (Sorted by selected sort key, fixed 14D DRR default)
  const topVelocityItems = useMemo(() => {
    return [...items]
      .filter((i) => i.drr_14d > 0 || i.drr_7d > 0 || i.drr_30d > 0)
      .sort(sortComparator);
  }, [items, velocitySortKey, velocitySortDir, customDays]);

  // Top DRR Item (#1 14D DRR)
  const topDRRItem = useMemo(() => {
    return [...items].sort((a, b) => b.drr_14d - a.drr_14d)[0];
  }, [items]);

  // Top Trend Item (Highest positive acceleration percentage with outward movement)
  const topTrendItem = useMemo(() => {
    return [...items]
      .filter((i) => (i.drr_30d > 0 || i.drr_7d > 0) && i.accel_pct > 0)
      .sort((a, b) => b.accel_pct - a.accel_pct)[0];
  }, [items]);

  // Worst Trend Item (Steepest negative acceleration percentage with 30D baseline)
  const worstTrendItem = useMemo(() => {
    return [...items]
      .filter((i) => i.drr_30d > 0 && i.accel_pct < 0)
      .sort((a, b) => a.accel_pct - b.accel_pct)[0];
  }, [items]);

  // Worst DRR Item (Lowest active non-zero mover, or lowest velocity with stock)
  const worstDRRItem = useMemo(() => {
    const activeMovers = [...items].filter((i) => i.drr_14d > 0);
    if (activeMovers.length > 0) {
      return activeMovers.sort((a, b) => a.drr_14d - b.drr_14d)[0];
    }
    return [...items].sort((a, b) => a.drr_14d - b.drr_14d)[0];
  }, [items]);

  // Dead stock: current_stock > 0 and outward_30d === 0
  const deadStockItems = useMemo(() => {
    return items
      .filter((i) => i.current_stock > 0 && i.outward_30d === 0)
      .sort((a, b) => b.current_stock - a.current_stock);
  }, [items]);

  const deadStockTotalUnits = useMemo(() => {
    return deadStockItems.reduce((sum, i) => sum + i.current_stock, 0);
  }, [deadStockItems]);

  // Excess stock: Cover > 60 days based on FIXED 14D DRR
  const excessStockItems = useMemo(() => {
    return items
      .filter((i) => {
        const cover = getCoverDays14D(i);
        return cover > 60 && cover < 999 && i.current_stock > 0;
      })
      .sort((a, b) => b.current_stock - a.current_stock);
  }, [items]);

  // Handle upper interactive KPI cards clicks
  const handleCardClick = (
    type: "all" | "top_drr" | "top_trend" | "worst_drr" | "worst_trend" | "dead_stock" | "excess"
  ) => {
    setCardFilter((prev) => (prev === type ? "all" : type));
    setMatrixFilter(null);
    if (type === "dead_stock") {
      setActiveTab("dead_stock");
    } else {
      setActiveTab("velocity");
    }
  };

  // Base list for Tab 1 based on active tab or upper card filter
  const baseVelocityList = useMemo(() => {
    if (activeTab === "excess" || cardFilter === "excess") {
      return [...excessStockItems].sort(sortComparator);
    }
    if (cardFilter === "top_drr") return topVelocityItems.slice(0, 50);
    if (cardFilter === "top_trend") {
      return [...items]
        .filter((i) => (i.drr_30d > 0 || i.drr_7d > 0) && i.accel_pct > 0)
        .sort((a, b) => b.accel_pct - a.accel_pct);
    }
    if (cardFilter === "worst_trend") {
      return [...items]
        .filter((i) => i.drr_30d > 0 && i.accel_pct < 0)
        .sort((a, b) => a.accel_pct - b.accel_pct);
    }
    if (cardFilter === "worst_drr") {
      return [...items]
        .filter((i) => i.drr_14d > 0 || i.current_stock > 0)
        .sort((a, b) => a.drr_14d - b.drr_14d);
    }
    return topVelocityItems;
  }, [activeTab, cardFilter, excessStockItems, topVelocityItems, items, sortComparator]);

  // Filtered Velocity list based on search
  const filteredVelocity = useMemo(() => {
    if (!searchQuery.trim()) return baseVelocityList;
    const q = searchQuery.toLowerCase().trim();
    return baseVelocityList.filter(
      (i) =>
        i.sku_code.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.brand.toLowerCase().includes(q)
    );
  }, [baseVelocityList, searchQuery]);

  // Filtered Dead Stock list based on search
  const filteredDeadStock = useMemo(() => {
    if (!searchQuery.trim()) return deadStockItems;
    const q = searchQuery.toLowerCase().trim();
    return deadStockItems.filter(
      (i) =>
        i.sku_code.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.brand.toLowerCase().includes(q)
    );
  }, [deadStockItems, searchQuery]);

  // Filtered items when a specific Sourcing Channel or Category is selected in Tab 3
  const matrixDrilldownItems = useMemo(() => {
    if (!matrixFilter) return [];
    let list = items.filter((i) => {
      if (matrixFilter.type === "sourcing") {
        return (i.sourcing || "MARKET") === matrixFilter.value;
      } else {
        return (i.category || "UNCATEGORIZED") === matrixFilter.value;
      }
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.sku_code.toLowerCase().includes(q) ||
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.brand.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => b.drr_14d - a.drr_14d);
  }, [items, matrixFilter, searchQuery]);

  const matrixTotalStock = useMemo(() => {
    return matrixDrilldownItems.reduce((sum, i) => sum + i.current_stock, 0);
  }, [matrixDrilldownItems]);

  // CSV Export
  const handleExportCSV = () => {
    let listToExport = filteredVelocity;
    let filenamePrefix = "velocity";

    if (activeTab === "dead_stock") {
      listToExport = filteredDeadStock;
      filenamePrefix = "dead-stock";
    } else if (activeTab === "excess") {
      listToExport = filteredVelocity;
      filenamePrefix = "excess-cover";
    } else if (activeTab === "sourcing_matrix" && matrixFilter) {
      listToExport = matrixDrilldownItems;
      filenamePrefix = `${matrixFilter.type}-${matrixFilter.value.toLowerCase().replace(/\s+/g, "_")}`;
    }

    const headers = [
      "SKU Code",
      "Product Name",
      "Category",
      "Sourcing",
      "Current Stock",
      "14D Outward",
      "14D DRR (Std)",
      "7D Outward",
      "7D DRR",
      "30D Outward",
      "30D DRR",
      ...(showCustomColumn ? [`${customDays}D Outward (Custom)`, `${customDays}D DRR (Custom)`] : []),
      "Cover Days (14D)",
      "Status"
    ];

    const rows = listToExport.map((i) => {
      const cover = getCoverDays14D(i);
      return [
        `"${i.sku_code}"`,
        `"${(i.name || "").replace(/"/g, '""')}"`,
        `"${i.category || ""}"`,
        `"${i.sourcing || ""}"`,
        i.current_stock,
        i.outward_14d,
        i.drr_14d,
        i.outward_7d,
        i.drr_7d,
        i.outward_30d,
        i.drr_30d,
        ...(showCustomColumn ? [getDynamicOutward(i, customDays), getDynamicDRR(i, customDays)] : []),
        cover >= 999 ? "N/A" : `${cover}d`,
        `"${i.risk_status}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `warehouse-drr-${filenamePrefix}-${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 max-w-[1700px] mx-auto pb-12">
      {/* 1. Header (Clean, commanding, concrete - No AI buzzwords) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-950 tracking-tight">
            Warehouse - Daily Run Rate
          </h1>
        </div>

        {/* DRR Horizon Controller */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-lg border border-slate-200/90 shadow-2xs self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider px-2">
            Sort:
          </span>
          <button
            onClick={() => handleSort("14d")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-bold transition-all",
              velocitySortKey === "14d"
                ? "bg-slate-950 text-white shadow-2xs"
                : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
            )}
          >
            14D Standard {velocitySortKey === "14d" && (velocitySortDir === "desc" ? "↓" : "↑")}
          </button>
          <button
            onClick={() => handleSort("7d")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-bold transition-all",
              velocitySortKey === "7d"
                ? "bg-slate-950 text-white shadow-2xs"
                : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
            )}
          >
            7D {velocitySortKey === "7d" && (velocitySortDir === "desc" ? "↓" : "↑")}
          </button>
          <button
            onClick={() => handleSort("30d")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-bold transition-all",
              velocitySortKey === "30d"
                ? "bg-slate-950 text-white shadow-2xs"
                : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
            )}
          >
            30D {velocitySortKey === "30d" && (velocitySortDir === "desc" ? "↓" : "↑")}
          </button>
          <button
            onClick={() => handleSort("trend")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-bold transition-all",
              velocitySortKey === "trend"
                ? "bg-slate-950 text-white shadow-2xs"
                : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
            )}
          >
            Trend {velocitySortKey === "trend" && (velocitySortDir === "desc" ? "↓" : "↑")}
          </button>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            {!showCustomColumn ? (
              <button
                type="button"
                onClick={() => {
                  setShowCustomColumn(true);
                  handleSort("custom");
                }}
                className="px-2.5 py-1 rounded text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1 shadow-2xs"
              >
                <span>+ Custom DRR Column</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-indigo-50/80 border border-indigo-200 px-2 py-0.5 rounded">
                <span className="text-xs font-bold text-indigo-950">Custom:</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={customDaysInput}
                  onChange={(e) => {
                    setCustomDaysInput(e.target.value);
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1 && val <= 30) {
                      setCustomDays(val);
                    }
                  }}
                  className="w-12 h-6 px-1 text-center font-mono font-bold text-xs bg-white border border-indigo-300 rounded outline-none focus:ring-1 focus:ring-indigo-600 text-slate-950"
                />
                <span className="text-indigo-950 font-bold text-xs">d</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomColumn(false);
                    if (velocitySortKey === "custom") {
                      setVelocitySortKey("14d");
                      setVelocitySortDir("desc");
                    }
                  }}
                  className="text-indigo-500 hover:text-indigo-900 p-0.5 ml-1 transition-colors"
                  title="Hide custom column"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. UPPER INTERACTIVE DECISION KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {/* Card 1: Top SKU - Warehouse DRR Wise */}
        <button
          type="button"
          onClick={() => handleCardClick("top_drr")}
          className={cn(
            "text-left p-3.5 rounded-lg border transition-all relative overflow-hidden group shadow-2xs cursor-pointer flex flex-col justify-between",
            cardFilter === "top_drr" && activeTab === "velocity"
              ? "bg-indigo-50/20 border-indigo-500 ring-2 ring-indigo-500/20"
              : "bg-white border-slate-200 hover:border-slate-400"
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Top SKU (DRR)</span>
              <span className="text-[11px] font-bold text-indigo-700 font-mono">
                #1 Velocity
              </span>
            </div>
            <div className="text-base font-bold font-mono text-slate-950 mt-1.5 truncate" title={topDRRItem?.sku_code}>
              {topDRRItem?.sku_code || "—"}
            </div>
            <div className="text-xs font-mono text-slate-600 truncate mt-0.5" title={topDRRItem?.name}>
              {topDRRItem?.name || ""}
            </div>
            <div className="text-sm font-mono text-slate-900 mt-1.5">
              DRR: <strong className="font-bold text-indigo-700">{topDRRItem?.drr_14d || 0} u/day</strong>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Click to view top movers</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* Card 2: Top SKU - Trend Wise (+ve Surge) */}
        <button
          type="button"
          onClick={() => handleCardClick("top_trend")}
          className={cn(
            "text-left p-3.5 rounded-lg border transition-all relative overflow-hidden group shadow-2xs cursor-pointer flex flex-col justify-between",
            cardFilter === "top_trend" && activeTab === "velocity"
              ? "bg-emerald-50/20 border-emerald-500 ring-2 ring-emerald-500/20"
              : "bg-white border-slate-200 hover:border-slate-400"
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Top Surge (Trend)</span>
              <span className="text-[11px] font-bold text-emerald-700 font-mono">
                Demand Surge
              </span>
            </div>
            <div className="text-base font-bold font-mono text-slate-950 mt-1.5 truncate" title={topTrendItem?.sku_code}>
              {topTrendItem?.sku_code || "—"}
            </div>
            <div className="text-xs font-mono text-slate-600 truncate mt-0.5" title={topTrendItem?.name}>
              {topTrendItem?.name || ""}
            </div>
            <div className="text-sm font-mono text-slate-900 mt-1.5">
              Trend: <strong className="font-bold text-emerald-700">+{topTrendItem?.accel_pct || 0}%</strong>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Click to view surge items</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* Card 3: Worst Performer - Warehouse DRR Wise */}
        <button
          type="button"
          onClick={() => handleCardClick("worst_drr")}
          className={cn(
            "text-left p-3.5 rounded-lg border transition-all relative overflow-hidden group shadow-2xs cursor-pointer flex flex-col justify-between",
            cardFilter === "worst_drr" && activeTab === "velocity"
              ? "bg-amber-50/20 border-amber-500 ring-2 ring-amber-500/20"
              : "bg-white border-slate-200 hover:border-slate-400"
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Lowest DRR</span>
              <span className="text-[11px] font-bold text-amber-800 font-mono">
                Slowest Active
              </span>
            </div>
            <div className="text-base font-bold font-mono text-slate-950 mt-1.5 truncate" title={worstDRRItem?.sku_code}>
              {worstDRRItem?.sku_code || "—"}
            </div>
            <div className="text-xs font-mono text-slate-600 truncate mt-0.5" title={worstDRRItem?.name}>
              {worstDRRItem?.name || ""}
            </div>
            <div className="text-sm font-mono text-slate-900 mt-1.5">
              DRR: <strong className="font-bold text-amber-800">{worstDRRItem?.drr_14d || 0} u/day</strong>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Click to view slow movers</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* Card 4: Worst Performer - Trend Wise (-ve Decline) */}
        <button
          type="button"
          onClick={() => handleCardClick("worst_trend")}
          className={cn(
            "text-left p-3.5 rounded-lg border transition-all relative overflow-hidden group shadow-2xs cursor-pointer flex flex-col justify-between",
            cardFilter === "worst_trend" && activeTab === "velocity"
              ? "bg-rose-50/20 border-rose-500 ring-2 ring-rose-500/20"
              : "bg-white border-slate-200 hover:border-slate-400"
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Steepest Drop</span>
              <span className="text-[11px] font-bold text-rose-700 font-mono">
                Fastest Slowdown
              </span>
            </div>
            <div className="text-base font-bold font-mono text-slate-950 mt-1.5 truncate" title={worstTrendItem?.sku_code}>
              {worstTrendItem?.sku_code || "—"}
            </div>
            <div className="text-xs font-mono text-slate-600 truncate mt-0.5" title={worstTrendItem?.name}>
              {worstTrendItem?.name || ""}
            </div>
            <div className="text-sm font-mono text-slate-900 mt-1.5">
              Trend: <strong className="font-bold text-rose-700">{worstTrendItem?.accel_pct || 0}%</strong>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Click to view declining items</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* Card 5: Dead Stock Items */}
        <button
          type="button"
          onClick={() => handleCardClick("dead_stock")}
          className={cn(
            "text-left p-3.5 rounded-lg border transition-all relative overflow-hidden group shadow-2xs cursor-pointer flex flex-col justify-between",
            activeTab === "dead_stock"
              ? "bg-amber-50/20 border-amber-500 ring-2 ring-amber-500/20"
              : "bg-white border-slate-200 hover:border-slate-400"
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Dead Stock Items</span>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-950 mt-1.5">
              {deadStockItems.length} <span className="text-xs font-bold text-slate-700 uppercase">SKUs</span>
            </div>
            <div className="text-xs font-mono text-slate-600 mt-0.5">
              0 Outward in 30 Days
            </div>
            <div className="text-sm font-mono text-slate-900 mt-1.5">
              Holding <strong className="font-bold text-slate-950">{formatNumber(deadStockTotalUnits)}</strong> units
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Click to view dead stock</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </div>

      {/* 3. NAVIGATION TABS & FILTER BAR */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setActiveTab("velocity");
                setCardFilter("all");
                setMatrixFilter(null);
              }}
              className={cn(
                "px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2",
                activeTab === "velocity" && cardFilter !== "excess"
                  ? "bg-slate-950 text-white shadow-2xs"
                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-200"
              )}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Velocity Movers ({topVelocityItems.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("excess");
                setCardFilter("all");
                setMatrixFilter(null);
              }}
              className={cn(
                "px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2",
                activeTab === "excess"
                  ? "bg-slate-950 text-white shadow-2xs"
                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-200"
              )}
            >
              <Clock className="w-4 h-4" />
              <span>Excess Cover ({excessStockItems.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("dead_stock");
                setCardFilter("all");
                setMatrixFilter(null);
              }}
              className={cn(
                "px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2",
                activeTab === "dead_stock"
                  ? "bg-slate-950 text-white shadow-2xs"
                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-200"
              )}
            >
              <PackageX className="w-4 h-4" />
              <span>Dead Stock ({deadStockItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("sourcing_matrix")}
              className={cn(
                "px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2",
                activeTab === "sourcing_matrix"
                  ? "bg-slate-950 text-white shadow-2xs"
                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-200"
              )}
            >
              <Layers className="w-4 h-4" />
              <span>Sourcing & Categories Matrix</span>
              {matrixFilter && (
                <span className="ml-1 px-1.5 py-0.2 rounded bg-indigo-500 text-white text-[10px] font-mono">
                  {matrixFilter.value}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {cardFilter !== "all" && (
              <button
                onClick={() => {
                  setCardFilter("all");
                  setActiveTab("velocity");
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-bold text-slate-800 bg-slate-200 hover:bg-slate-300 transition-colors shadow-2xs cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Velocity / Excess Table */}
        {(activeTab === "velocity" || activeTab === "excess") && (
          <div>
            <div className="p-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter by SKU code, title, brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 placeholder:text-slate-500 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs font-mono font-bold text-slate-800">
                <span>Showing {filteredVelocity.length} items</span>
                <span>•</span>
                <span className="text-slate-700 font-sans">
                  {activeTab === "excess" || cardFilter === "excess" ? (
                    <span className="text-blue-700 font-bold uppercase">Pre-Filtered: Excess Stock Cover (&gt;60D Standard Cover)</span>
                  ) : cardFilter === "top_drr" ? (
                    <span className="text-indigo-700 font-bold uppercase">Filtered: Top 50 Velocity Movers (14D DRR)</span>
                  ) : cardFilter === "top_trend" ? (
                    <span className="text-emerald-700 font-bold uppercase">Filtered: Top Accelerating SKUs (+ve Demand Surge)</span>
                  ) : cardFilter === "worst_trend" ? (
                    <span className="text-rose-700 font-bold uppercase">Filtered: Steepest Declining SKUs (-ve Demand Drop)</span>
                  ) : cardFilter === "worst_drr" ? (
                    <span className="text-amber-800 font-bold uppercase">Filtered: Slowest Moving SKUs (DRR Low to High)</span>
                  ) : (
                    <>
                      Sorted by: <strong className="text-slate-950 uppercase">{velocitySortKey === "custom" ? `${customDays}D Custom DRR` : velocitySortKey === "trend" ? "Trend (Last 7D vs 30D)" : `${velocitySortKey} DRR`}</strong> ({velocitySortDir === "desc" ? "High to Low" : "Low to High"})
                    </>
                  )}
                </span>
                {showCustomColumn && (
                  <>
                    <span>•</span>
                    <span className="text-indigo-700 font-sans font-semibold">
                      Extra Column: {customDays}D Custom DRR Active
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-left min-w-[1050px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-800 select-none">
                  <tr>
                    <th className="py-2.5 px-3 w-[4%]">#</th>
                    <th
                      onClick={() => handleSort("name")}
                      className={cn(
                        "py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors",
                        showCustomColumn ? "w-[24%]" : "w-[30%]"
                      )}
                    >
                      <div className="flex items-center gap-1">
                        <span>Product Title & SKU</span>
                        {velocitySortKey === "name" && (
                          <span className="text-xs text-indigo-700 font-bold">{velocitySortDir === "desc" ? "↓" : "↑"}</span>
                        )}
                      </div>
                    </th>
                    <th className="py-2.5 px-3 w-[9%]">Sourcing</th>

                    {/* Fixed 14D DRR Standard */}
                    <th
                      onClick={() => handleSort("14d")}
                      className={cn(
                        "py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors w-[11%]",
                        velocitySortKey === "14d" ? "bg-indigo-50/60 text-indigo-950 font-bold" : ""
                      )}
                      title="14-Day Warehouse Daily Run Rate (Standard Baseline)"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>14D DRR</span>
                        <span className="text-[10px] text-indigo-600 font-bold">(Std)</span>
                        {velocitySortKey === "14d" && (
                          <span className="text-xs text-indigo-700 font-bold">{velocitySortDir === "desc" ? "↓" : "↑"}</span>
                        )}
                      </div>
                    </th>

                    {/* Fixed 7D DRR */}
                    <th
                      onClick={() => handleSort("7d")}
                      className={cn(
                        "py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors w-[9%]",
                        velocitySortKey === "7d" ? "bg-indigo-50/60 text-indigo-950 font-bold" : ""
                      )}
                      title="7-Day Warehouse Daily Run Rate"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>7D DRR</span>
                        {velocitySortKey === "7d" && (
                          <span className="text-xs text-indigo-700 font-bold">{velocitySortDir === "desc" ? "↓" : "↑"}</span>
                        )}
                      </div>
                    </th>

                    {/* Fixed 30D DRR */}
                    <th
                      onClick={() => handleSort("30d")}
                      className={cn(
                        "py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors w-[9%]",
                        velocitySortKey === "30d" ? "bg-indigo-50/60 text-indigo-950 font-bold" : ""
                      )}
                      title="30-Day Warehouse Daily Run Rate"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>30D DRR</span>
                        {velocitySortKey === "30d" && (
                          <span className="text-xs text-indigo-700 font-bold">{velocitySortDir === "desc" ? "↓" : "↑"}</span>
                        )}
                      </div>
                    </th>

                    {/* Optional Extra Custom Column */}
                    {showCustomColumn && (
                      <th
                        onClick={() => handleSort("custom")}
                        className="py-2.5 px-3 text-right cursor-pointer bg-indigo-50 border-x border-indigo-200 text-indigo-950 font-bold transition-colors hover:bg-indigo-100/80 w-[11%]"
                        title={`Custom ${customDays}-Day Warehouse Daily Run Rate`}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>{customDays}D DRR</span>
                          <span className="text-[10px] text-indigo-600 font-semibold">(Custom)</span>
                          {velocitySortKey === "custom" && (
                            <span className="text-xs text-indigo-700 font-bold">{velocitySortDir === "desc" ? "↓" : "↑"}</span>
                          )}
                        </div>
                      </th>
                    )}

                    {/* Trend Column with Sort Arrow and Subtitle */}
                    <th
                      onClick={() => handleSort("trend")}
                      className={cn(
                        "py-2.5 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors w-[11%]",
                        velocitySortKey === "trend" ? "bg-indigo-50/60 text-indigo-950 font-bold" : ""
                      )}
                      title="Demand Velocity Momentum: Click to sort by acceleration (+ve) or slowdown (-ve)"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center justify-center gap-1">
                          <span>Trend</span>
                          {velocitySortKey === "trend" && (
                            <span className="text-xs text-indigo-700 font-bold">{velocitySortDir === "desc" ? "↓" : "↑"}</span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono font-medium text-slate-500 uppercase tracking-tight leading-none mt-0.5">
                          Last 7D vs 30D
                        </span>
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort("stock")}
                      className={cn(
                        "py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors w-[10%]",
                        velocitySortKey === "stock" ? "bg-indigo-50/60 text-indigo-950 font-bold" : ""
                      )}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Current Stock</span>
                        {velocitySortKey === "stock" && (
                          <span className="text-xs text-indigo-700 font-bold">{velocitySortDir === "desc" ? "↓" : "↑"}</span>
                        )}
                      </div>
                    </th>

                    {/* Fixed Cover Days (Strictly 14D standard, never changes) */}
                    <th
                      onClick={() => handleSort("cover")}
                      className={cn(
                        "py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors w-[12%]",
                        velocitySortKey === "cover" ? "bg-indigo-50/60 text-indigo-950 font-bold" : ""
                      )}
                      title="Stock Cover Days strictly based on 14D DRR Standard"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Cover (14D)</span>
                        {velocitySortKey === "cover" && (
                          <span className="text-xs text-indigo-700 font-bold">{velocitySortDir === "desc" ? "↓" : "↑"}</span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px] leading-5">
                  {filteredVelocity.map((item, idx) => {
                    const coverDays14 = getCoverDays14D(item);
                    const isAcc = item.demand_trend === "ACCELERATING";
                    const isDec = item.demand_trend === "DECLINING";
                    const customDRR = showCustomColumn ? getDynamicDRR(item, customDays) : 0;

                    return (
                      <tr key={item.sku_code} className="hover:bg-slate-50/80 transition-colors group h-12">
                        <td className="py-2 px-3 font-mono text-xs text-slate-500 align-middle">
                          #{idx + 1}
                        </td>
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
                        <td className="py-2 px-3 overflow-hidden align-middle">
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {item.sourcing || "MARKET"}
                          </span>
                        </td>

                        {/* Fixed 14D DRR (Std) */}
                        <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono font-bold text-[13px] text-slate-950">
                          {item.drr_14d} <span className="font-normal text-xs text-slate-600">/d</span>
                        </td>

                        {/* Fixed 7D DRR */}
                        <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono font-medium text-xs text-slate-700">
                          {item.drr_7d} <span className="font-normal text-[11px] text-slate-500">/d</span>
                        </td>

                        {/* Fixed 30D DRR */}
                        <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono font-medium text-xs text-slate-700">
                          {item.drr_30d} <span className="font-normal text-[11px] text-slate-500">/d</span>
                        </td>

                        {/* Optional Extra Custom DRR Column */}
                        {showCustomColumn && (
                          <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono font-bold text-[13px] text-indigo-950 bg-indigo-50/30 border-x border-indigo-100">
                            {customDRR} <span className="font-normal text-xs text-indigo-600">/d</span>
                          </td>
                        )}

                        {/* Trend */}
                        <td className="py-2 px-3 text-center overflow-hidden align-middle">
                          {isAcc ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <TrendingUp className="w-3 h-3" />
                              +{item.accel_pct}%
                            </span>
                          ) : isDec ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold font-mono bg-rose-50 text-rose-800 border border-rose-200">
                              <TrendingDown className="w-3 h-3" />
                              {item.accel_pct}%
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono text-slate-700 bg-slate-100 border border-slate-200">
                              STABLE
                            </span>
                          )}
                        </td>

                        {/* Current Stock */}
                        <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono font-bold text-slate-950 text-[13px]">
                          {formatNumber(item.current_stock)}
                        </td>

                        {/* Fixed Cover Days (Strictly 14D DRR) */}
                        <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono text-xs">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-xs font-bold font-mono",
                              item.current_stock === 0
                                ? "bg-rose-50 text-rose-900 border border-rose-200"
                                : coverDays14 < 7
                                ? "bg-rose-50 text-rose-900 border border-rose-200"
                                : coverDays14 < 15
                                ? "bg-amber-50 text-amber-950 border border-amber-200"
                                : coverDays14 > 60
                                ? "bg-blue-50 text-blue-900 border border-blue-200"
                                : "bg-slate-100 text-slate-800 border border-slate-200"
                            )}
                          >
                            {item.current_stock === 0 ? "0d (OOS)" : coverDays14 >= 999 ? "∞" : `${coverDays14}d`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Dead Stock Table */}
        {activeTab === "dead_stock" && (
          <div>
            <div className="p-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-800 shrink-0" />
                <span className="text-xs text-amber-950 font-medium">
                  Dead stock represents products with inventory on-hand but <strong>zero outward dispatches</strong> over the last 30 recorded days. Liquidating these items unlocks tied-up capital.
                </span>
              </div>
            </div>

            <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter dead stock items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 placeholder:text-slate-500 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-xs font-mono font-bold text-slate-800">
                {filteredDeadStock.length} Dead SKUs ({formatNumber(deadStockTotalUnits)} units)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-left min-w-[900px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-800 select-none">
                  <tr>
                    <th className="py-2.5 px-3 w-[40%]">Product Title & SKU</th>
                    <th className="py-2.5 px-3 w-[15%]">Category</th>
                    <th className="py-2.5 px-3 w-[15%]">Sourcing</th>
                    <th className="py-2.5 px-3 text-right w-[15%]">Current Stock</th>
                    <th className="py-2.5 px-3 text-right w-[15%]">Last Outward</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px] leading-5">
                  {filteredDeadStock.map((item) => (
                    <tr key={item.sku_code} className="hover:bg-slate-50/80 transition-colors group h-12">
                      <td className="py-2 px-3 overflow-hidden align-middle">
                        <div className="flex flex-col min-w-0">
                          <Link
                            href={`/product/${encodeURIComponent(item.sku_code)}`}
                            className="truncate block font-semibold text-slate-950 text-[13px] hover:text-indigo-600 hover:underline transition-colors leading-snug"
                            title={item.name}
                          >
                            {item.name}
                          </Link>
                          <span className="font-mono text-xs text-slate-700 font-medium">{item.sku_code}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 overflow-hidden align-middle text-slate-700 text-xs font-medium truncate">
                        {item.category}
                      </td>
                      <td className="py-2 px-3 overflow-hidden align-middle">
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {item.sourcing || "MARKET"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono font-bold text-[13px] text-slate-950">
                        {formatNumber(item.current_stock)}
                      </td>
                      <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono text-xs text-slate-600">
                        {item.last_outward_date ? formatDate(item.last_outward_date) : "> 30 days ago"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Sourcing & Category Matrix (Unified, No subcards, Drilldown interactive) */}
        {activeTab === "sourcing_matrix" && (
          <div>
            {/* If a category/sourcing is clicked, show the Drill-Down Table */}
            {matrixFilter ? (
              <div>
                <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setMatrixFilter(null)}
                      className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Matrix</span>
                    </button>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-950">
                        {matrixFilter.type === "sourcing" ? "Sourcing Channel" : "Category"}: {matrixFilter.value}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {matrixDrilldownItems.length} Active SKUs • {formatNumber(matrixTotalStock)} units on hand
                      </p>
                    </div>
                  </div>

                  <div className="relative flex-1 max-w-xs">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder={`Search in ${matrixFilter.value}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 font-medium"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Drill-down Table */}
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed border-collapse text-left min-w-[1050px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-800 select-none">
                      <tr>
                        <th className="py-2.5 px-3 w-[4%]">#</th>
                        <th className={cn("py-2.5 px-3", showCustomColumn ? "w-[24%]" : "w-[30%]")}>Product Title & SKU</th>
                        <th className="py-2.5 px-3 w-[10%]">
                          {matrixFilter.type === "sourcing" ? "Category" : "Sourcing"}
                        </th>
                        <th className="py-2.5 px-3 text-right w-[11%]">Current Stock</th>
                        <th className="py-2.5 px-3 text-right w-[11%]">
                          <div className="flex items-center justify-end gap-1">
                            <span>14D DRR</span>
                            <span className="text-[10px] text-indigo-600 font-bold">(Std)</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-3 text-right w-[9%]">7D DRR</th>
                        <th className="py-2.5 px-3 text-right w-[9%]">30D DRR</th>
                        {showCustomColumn && (
                          <th className="py-2.5 px-3 text-right bg-indigo-50 border-x border-indigo-200 text-indigo-950 font-bold w-[11%]">
                            <div className="flex items-center justify-end gap-1">
                              <span>{customDays}D DRR</span>
                              <span className="text-[10px] text-indigo-600 font-semibold">(Custom)</span>
                            </div>
                          </th>
                        )}
                        <th className="py-2.5 px-3 text-right w-[12%]">
                          Cover (14D)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[13px] leading-5">
                      {matrixDrilldownItems.map((item, idx) => {
                        const cover = getCoverDays14D(item);
                        const customDRR = showCustomColumn ? getDynamicDRR(item, customDays) : 0;

                        return (
                          <tr key={item.sku_code} className="hover:bg-slate-50/80 transition-colors group h-12">
                            <td className="py-2 px-3 font-mono text-xs text-slate-500 align-middle">
                              #{idx + 1}
                            </td>
                            <td className="py-2 px-3 overflow-hidden align-middle">
                              <div className="flex flex-col min-w-0">
                                <Link
                                  href={`/product/${encodeURIComponent(item.sku_code)}`}
                                  className="truncate block font-semibold text-slate-950 text-[13px] hover:text-indigo-600 hover:underline transition-colors leading-snug"
                                  title={item.name}
                                >
                                  {item.name}
                                </Link>
                                <span className="font-mono text-xs text-slate-700 font-medium">{item.sku_code}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3 overflow-hidden align-middle">
                              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                {matrixFilter.type === "sourcing" ? item.category : item.sourcing}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono font-bold text-slate-950 text-[13px]">
                              {formatNumber(item.current_stock)}
                            </td>
                            <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono font-bold text-[13px] text-slate-950">
                              {item.drr_14d} <span className="font-normal text-xs text-slate-600">/d</span>
                            </td>
                            <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono font-medium text-xs text-slate-700">
                              {item.drr_7d} <span className="font-normal text-[11px] text-slate-500">/d</span>
                            </td>
                            <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono font-medium text-xs text-slate-700">
                              {item.drr_30d} <span className="font-normal text-[11px] text-slate-500">/d</span>
                            </td>
                            {showCustomColumn && (
                              <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono font-bold text-[13px] text-indigo-950 bg-indigo-50/30 border-x border-indigo-100">
                                {customDRR} <span className="font-normal text-xs text-indigo-600">/d</span>
                              </td>
                            )}
                            <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono text-xs">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded text-xs font-bold font-mono",
                                  item.current_stock === 0
                                    ? "bg-rose-50 text-rose-900 border border-rose-200"
                                    : cover < 7
                                    ? "bg-rose-50 text-rose-900 border border-rose-200"
                                    : cover < 15
                                    ? "bg-amber-50 text-amber-950 border border-amber-200"
                                    : cover > 60
                                    ? "bg-blue-50 text-blue-900 border border-blue-200"
                                    : "bg-slate-100 text-slate-800 border border-slate-200"
                                )}
                              >
                                {item.current_stock === 0 ? "0d (OOS)" : cover >= 999 ? "∞" : `${cover}d`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Two Unified Cards Side-by-Side (NO nested sub-cards!) */
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Unified Sourcing Channel Matrix */}
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs flex flex-col">
                  <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-800" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-950">
                        Sourcing Channel Matrix
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {sourcingBreakdown.length} Channels
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {sourcingBreakdown.map((s) => (
                      <div
                        key={s.sourcing}
                        className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-950 font-mono uppercase">
                              {s.sourcing || "MARKET"}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">
                              ({s.skuCount} Active SKUs)
                            </span>
                          </div>
                          <div className="text-xs text-slate-700 mt-1">
                            Run Rate (14D): <strong className="font-mono text-slate-950 font-bold">{s.avgDrr14d || s.avgDrr} u/d</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <div className="font-mono font-bold text-sm text-slate-950">
                              {formatNumber(s.totalStock)}
                            </div>
                            <div className="text-xs font-bold text-slate-600">units</div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setMatrixFilter({ type: "sourcing", value: s.sourcing || "MARKET" })}
                            className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-950 hover:text-white text-slate-800 font-bold text-xs transition-colors flex items-center gap-1.5 border border-slate-300 shadow-2xs"
                          >
                            <span>View {s.skuCount} SKUs</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Unified Top Product Categories by Volume */}
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs flex flex-col">
                  <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-indigo-700" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-950">
                        Top Product Categories by Volume
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {categoryBreakdown.length} Categories
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {categoryBreakdown.map((c) => (
                      <div
                        key={c.category}
                        className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-950 truncate max-w-[220px]" title={c.category}>
                              {c.category}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">
                              ({c.skuCount} SKUs)
                            </span>
                          </div>
                          <div className="text-xs text-slate-700 mt-1">
                            Run Rate (14D): <strong className="font-mono text-slate-950 font-bold">{c.avgDrr14d || c.avgDrr} u/d</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <div className="font-mono font-bold text-sm text-slate-950">
                              {formatNumber(c.totalStock)}
                            </div>
                            <div className="text-xs font-bold text-slate-600">units</div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setMatrixFilter({ type: "category", value: c.category })}
                            className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-950 hover:text-white text-slate-800 font-bold text-xs transition-colors flex items-center gap-1.5 border border-slate-300 shadow-2xs"
                          >
                            <span>View {c.skuCount} SKUs</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
