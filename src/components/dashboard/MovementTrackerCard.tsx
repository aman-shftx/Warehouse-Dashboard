"use client";

import { useState, useMemo } from "react";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  X, 
  Pencil, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  ArrowUpDown, 
  Boxes,
  RotateCcw,
  Check,
  AlertCircle,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { formatNumber, formatDate, cn } from "@/lib/utils";
import { MovementItem, MovementSectionData } from "@/lib/movement";

interface Props {
  type: "outward" | "inward";
  initialData: MovementSectionData;
  initialDays: number;
  latestDate: string | null;
  prevDate: string | null;
}

export function MovementTrackerCard({
  type,
  initialData,
  initialDays,
  latestDate: serverLatestDate,
  prevDate: serverPrevDate,
}: Props) {
  const isOutward = type === "outward";

  // State
  const [days, setDays] = useState<number>(initialDays);
  const [isCustomDays, setIsCustomDays] = useState<boolean>(false);
  const [customInputValue, setCustomInputValue] = useState<string>("14");
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);

  const [data, setData] = useState<MovementSectionData>(initialData);
  const [latestDate, setLatestDate] = useState<string | null>(serverLatestDate);
  const [prevDate, setPrevDate] = useState<string | null>(serverPrevDate);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<"change_qty" | "current_stock" | "name" | "sku" | "brand" | "category">("change_qty");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Fetch updated data when days change
  async function fetchDaysData(targetDays: number, customFlag: boolean = false) {
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory-movement?days=${targetDays}`);
      if (!res.ok) throw new Error("Failed to fetch movement data");
      const json = await res.json();

      setDays(targetDays);
      setIsCustomDays(customFlag);
      setLatestDate(json.latestDate);
      setPrevDate(json.prevDate);
      setData(isOutward ? json.outward : json.inward);
      setCurrentPage(1);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSelectDays = (d: number) => {
    setShowCustomModal(false);
    if (d === days && !isCustomDays) return;
    fetchDaysData(d, false);
  };

  const handleApplyCustomDays = () => {
    const parsed = parseInt(customInputValue, 10);
    if (!parsed || parsed < 1) return;
    setShowCustomModal(false);
    fetchDaysData(parsed, true);
  };

  // Distinct categories from data
  const categories = useMemo(() => {
    const set = new Set<string>();
    data.items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort();
  }, [data.items]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return data.items
      .filter((item) => {
        if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
          return false;
        }
        if (q) {
          const matchSku = item.sku.toLowerCase().includes(q);
          const matchName = item.name.toLowerCase().includes(q);
          const matchBrand = item.brand.toLowerCase().includes(q);
          const matchCat = item.category.toLowerCase().includes(q);
          if (!matchSku && !matchName && !matchBrand && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        if (typeof valA === "string") {
          return sortOrder === "asc"
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }

        return sortOrder === "asc"
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      });
  }, [data.items, searchQuery, selectedCategory, sortKey, sortOrder]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Category",
      "Brand",
      "Name",
      "SKU",
      isOutward ? "Dispatched Qty" : "Inward Qty",
      "Current Stock",
      "Previous Stock",
      "Comparison Period",
    ];

    const rows = filteredItems.map((item) => [
      `"${item.category || ""}"`,
      `"${item.brand || ""}"`,
      `"${(item.name || "").replace(/"/g, '""')}"`,
      `"${item.sku || ""}"`,
      item.change_qty,
      item.current_stock,
      item.prev_stock,
      `"${prevDate} to ${latestDate}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${type}-materials-${latestDate || "report"}-${days}d.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col h-full">
      {/* 1. Header with Title & Upper Right Pill Selector */}
      <div className="p-3.5 border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between gap-2">
          {/* Title & Type Badge */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center shrink-0 border",
                isOutward
                  ? "bg-rose-50 text-rose-600 border-rose-100"
                  : "bg-emerald-50 text-emerald-600 border-emerald-100"
              )}
            >
              {isOutward ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
                  {isOutward ? "Material Outward Tracker" : "Material Inward Tracker"}
                </h2>
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border shrink-0",
                    isOutward
                      ? "bg-rose-50 text-rose-700 border-rose-200/60"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                  )}
                >
                  {isOutward ? "Outward" : "Inward"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                {formatDate(prevDate)} → {formatDate(latestDate)}{" "}
                <span className="text-amber-700 font-sans font-medium text-[10px] bg-amber-50 px-1 py-0.2 rounded border border-amber-200/60">
                  T-1 Delay
                </span>
              </p>
            </div>
          </div>

          {/* Upper Right Days Selector Pill & Export CSV */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="relative inline-flex items-center rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
              {[1, 3, 7].map((d) => (
                <button
                  key={d}
                  onClick={() => handleSelectDays(d)}
                  disabled={loading}
                  className={cn(
                    "h-6 min-w-[24px] px-1.5 rounded transition-all text-[11px] font-semibold flex items-center justify-center",
                    days === d && !isCustomDays
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 disabled:opacity-50"
                  )}
                >
                  {d}d
                </button>
              ))}

              {/* Pencil icon for custom days */}
              <button
                onClick={() => setShowCustomModal(!showCustomModal)}
                title="Choose custom days"
                disabled={loading}
                className={cn(
                  "h-6 px-1.5 rounded transition-all text-[11px] font-semibold flex items-center justify-center gap-0.5",
                  isCustomDays
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 disabled:opacity-50"
                )}
              >
                {isCustomDays && <span className="font-mono text-[10px]">{days}d</span>}
                <Pencil className="w-3 h-3" />
              </button>

              {/* Custom Days Popover */}
              {showCustomModal && (
                <div className="absolute right-0 top-full mt-1.5 z-30 w-52 rounded-lg border border-slate-200 bg-white p-2.5 shadow-lg animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-800">Custom Days Window</span>
                    <button
                      onClick={() => setShowCustomModal(false)}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={customInputValue}
                        onChange={(e) => setCustomInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyCustomDays()}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                        placeholder="e.g. 14"
                        autoFocus
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      {[5, 14, 30].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCustomInputValue(String(preset))}
                          className="flex-1 py-0.5 text-[10px] font-mono rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                          {preset}d
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleApplyCustomDays}
                      className="w-full py-1 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Export CSV button */}
            <button
              onClick={handleExportCSV}
              title="Export CSV"
              className="h-6 w-6 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors"
            >
              <Download className="w-3 h-3 text-slate-500" />
            </button>
          </div>
        </div>

        {/* 2. Metrics Strip INSIDE the Master Card */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 bg-slate-50/70 rounded-md p-2.5 border border-slate-100">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
              {isOutward ? "Total Outward SKU" : "Total Inward SKU"}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-mono">
                {formatNumber(data.totalSkus)}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">SKUs</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
              {isOutward ? "SKU Total Quantities" : "SKU Total Quantities"}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={cn(
                  "text-base sm:text-lg font-bold tracking-tight font-mono",
                  isOutward ? "text-rose-700" : "text-emerald-700"
                )}
              >
                {isOutward ? `-${formatNumber(data.totalQty)}` : `+${formatNumber(data.totalQty)}`}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Units</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Controls Bar: Search & Category Filter */}
      <div className="p-2.5 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${isOutward ? "outward" : "inward"} materials...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-7 pr-6 py-1 text-xs bg-white border border-slate-200/90 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="h-6 px-1.5 text-[11px] bg-white border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium max-w-[150px] truncate"
          >
            <option value="ALL">All Categories ({data.items.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <span className="text-[10px] text-slate-400 font-mono shrink-0">
            {filteredItems.length} items
          </span>
        </div>
      </div>

      {/* 4. Data Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[10px] font-semibold text-slate-600 uppercase tracking-wider select-none">
              <th
                onClick={() => toggleSort("category")}
                className="py-2 px-2.5 cursor-pointer hover:text-slate-900 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-0.5">
                  <span>Category</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("brand")}
                className="py-2 px-2.5 cursor-pointer hover:text-slate-900 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-0.5">
                  <span>Brand</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("name")}
                className="py-2 px-2.5 cursor-pointer hover:text-slate-900 transition-colors min-w-[140px]"
              >
                <div className="flex items-center gap-0.5">
                  <span>Name</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("sku")}
                className="py-2 px-2.5 cursor-pointer hover:text-slate-900 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-0.5">
                  <span>SKU</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("change_qty")}
                className="py-2 px-2.5 cursor-pointer hover:text-slate-900 transition-colors text-right whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-0.5">
                  <span>{isOutward ? "Dispatched Qty" : "Inward Qty"}</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("current_stock")}
                className="py-2 px-2.5 cursor-pointer hover:text-slate-900 transition-colors text-right whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-0.5">
                  <span>Current Stock</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-[12px] leading-5">
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse h-8">
                  <td className="py-2 px-2.5"><div className="h-3.5 bg-slate-200 rounded w-16" /></td>
                  <td className="py-2 px-2.5"><div className="h-3.5 bg-slate-200 rounded w-12" /></td>
                  <td className="py-2 px-2.5"><div className="h-3.5 bg-slate-200 rounded w-36" /></td>
                  <td className="py-2 px-2.5"><div className="h-3.5 bg-slate-200 rounded w-20" /></td>
                  <td className="py-2 px-2.5 text-right"><div className="h-3.5 bg-slate-200 rounded w-12 ml-auto" /></td>
                  <td className="py-2 px-2.5 text-right"><div className="h-3.5 bg-slate-200 rounded w-12 ml-auto" /></td>
                </tr>
              ))
            ) : paginatedItems.length > 0 ? (
              paginatedItems.map((item) => (
                <tr
                  key={item.sku}
                  className="hover:bg-slate-50/80 transition-colors group h-8"
                >
                  {/* Category */}
                  <td className="py-1.5 px-2.5 whitespace-nowrap">
                    <span className="inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                      {item.category || "—"}
                    </span>
                  </td>

                  {/* Brand */}
                  <td className="py-1.5 px-2.5 whitespace-nowrap">
                    <span className="font-semibold text-slate-700 text-[11px]">
                      {item.brand || "—"}
                    </span>
                  </td>

                  {/* Name */}
                  <td className="py-1.5 px-2.5 max-w-[180px]">
                    <span
                      className="truncate block font-medium text-slate-900 text-xs"
                      title={item.name}
                    >
                      {item.name}
                    </span>
                  </td>

                  {/* SKU */}
                  <td className="py-1.5 px-2.5 whitespace-nowrap">
                    <span className="font-mono text-[11px] text-slate-600 bg-slate-50 px-1 py-0.2 rounded border border-slate-200/60 font-medium">
                      {item.sku}
                    </span>
                  </td>

                  {/* Dispatched Qty or Inward Qty */}
                  <td className="py-1.5 px-2.5 text-right whitespace-nowrap">
                    <span
                      className={cn(
                        "font-mono font-bold text-xs px-1.5 py-0.2 rounded border",
                        isOutward
                          ? "bg-rose-50 text-rose-700 border-rose-200/70"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                      )}
                    >
                      {isOutward ? `-${formatNumber(item.change_qty)}` : `+${formatNumber(item.change_qty)}`}
                    </span>
                  </td>

                  {/* Current Stock */}
                  <td className="py-1.5 px-2.5 text-right whitespace-nowrap font-mono font-semibold text-slate-900 text-xs">
                    {formatNumber(item.current_stock)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 px-3 text-center">
                  <div className="flex flex-col items-center justify-center max-w-xs mx-auto">
                    <AlertCircle className="w-4 h-4 text-slate-400 mb-1" />
                    <h4 className="text-xs font-semibold text-slate-700">
                      {searchQuery || selectedCategory !== "ALL"
                        ? `No ${isOutward ? "outward" : "inward"} materials match filters`
                        : `No ${isOutward ? "outward" : "inward"} activity in this ${days}d window`}
                    </h4>
                    {(searchQuery || selectedCategory !== "ALL") && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategory("ALL");
                        }}
                        className="mt-2 px-2.5 py-0.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Pagination */}
      {filteredItems.length > pageSize && (
        <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs text-slate-500 mt-auto">
          <span className="text-[11px]">
            <span className="font-semibold text-slate-800">
              {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredItems.length)}
            </span>{" "}
            of <span className="font-semibold text-slate-800">{filteredItems.length}</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-6 px-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center font-medium transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span className="text-[10px] px-1 font-mono text-slate-500">
              {currentPage}/{totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-6 px-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center font-medium transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
