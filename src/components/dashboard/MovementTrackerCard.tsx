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
  Truck,
  RotateCcw,
  Check,
  AlertCircle
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<"change_qty" | "current_stock" | "name" | "sku" | "brand" | "category">("change_qty");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Fetch updated data when days change
  async function fetchDaysData(targetDays: number, customFlag: boolean = false) {
    setLoading(true);
    setErrorMsg(null);
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
      setErrorMsg(err.message || "Failed to load updated timeframe");
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
      setSortOrder("desc"); // Default to desc for quick ranking
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
    <div className="space-y-3">
      {/* 1. Upper Row Small KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* KPI Card 1: Total SKUs */}
        <div className="bg-white rounded-lg border border-slate-200/80 p-3.5 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {isOutward ? "Total Outward SKU" : "Total Inward SKU"}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold tracking-tight text-slate-900 font-mono">
                {formatNumber(data.totalSkus)}
              </span>
              <span className="text-xs text-slate-400 font-medium">SKUs</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isOutward ? "Decreased stock vs last date" : "Increased stock vs last date"}
            </p>
          </div>
          <div
            className={cn(
              "w-9 h-9 rounded-md flex items-center justify-center shrink-0 border",
              isOutward
                ? "bg-rose-50 text-rose-600 border-rose-100"
                : "bg-emerald-50 text-emerald-600 border-emerald-100"
            )}
          >
            {isOutward ? <Boxes className="w-4 h-4" /> : <Boxes className="w-4 h-4" />}
          </div>
        </div>

        {/* KPI Card 2: SKU Total Quantities */}
        <div className="bg-white rounded-lg border border-slate-200/80 p-3.5 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {isOutward ? "SKU Total Quantities" : "SKU Total Quantities"}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold tracking-tight text-slate-900 font-mono">
                {formatNumber(data.totalQty)}
              </span>
              <span className="text-xs text-slate-400 font-medium">Units</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isOutward ? "Total dispatched quantity" : "Total inwarded quantity"}
            </p>
          </div>
          <div
            className={cn(
              "w-9 h-9 rounded-md flex items-center justify-center shrink-0 border",
              isOutward
                ? "bg-rose-50 text-rose-600 border-rose-100"
                : "bg-emerald-50 text-emerald-600 border-emerald-100"
            )}
          >
            {isOutward ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
          </div>
        </div>

        {/* KPI Card 3: Comparison Context & T-1 Reporting Delay Notice */}
        <div className="bg-slate-50/70 rounded-lg border border-slate-200/80 p-3.5 flex flex-col justify-between sm:col-span-2 lg:col-span-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Audit Window ({days}d)
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
              T-1 Delay Active
            </span>
          </div>
          <div className="mt-1">
            <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <span className="font-mono">{formatDate(prevDate)}</span>
              <span className="text-slate-400">→</span>
              <span className="font-mono text-indigo-700">{formatDate(latestDate)}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isOutward
                ? "Dispatched = Last Date Qty − Today Qty"
                : "Inward = Today Qty − Last Date Qty"}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Master Card Container */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        {/* Master Card Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                {isOutward ? "Material Outward Tracker" : "Material Inward Tracker"}
              </h2>
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase px-2 py-0.5 rounded border tracking-wide",
                  isOutward
                    ? "bg-rose-50 text-rose-700 border-rose-200/60"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                )}
              >
                {isOutward ? "Outward Only" : "Inward Only"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isOutward
                ? `Showing materials whose quantity decreased from ${formatDate(prevDate)} to ${formatDate(latestDate)}`
                : `Showing materials whose quantity increased from ${formatDate(prevDate)} to ${formatDate(latestDate)}`}
            </p>
          </div>

          {/* Upper Right Pill Square Shape Days Selector */}
          <div className="flex items-center gap-2 self-start md:self-center">
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Days:</span>
            <div className="relative inline-flex items-center rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
              {[1, 3, 7].map((d) => (
                <button
                  key={d}
                  onClick={() => handleSelectDays(d)}
                  disabled={loading}
                  className={cn(
                    "h-6 min-w-[28px] px-2 rounded transition-all text-xs font-semibold flex items-center justify-center",
                    days === d && !isCustomDays
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 disabled:opacity-50"
                  )}
                >
                  {d}
                </button>
              ))}

              {/* Pencil icon for custom days */}
              <button
                onClick={() => setShowCustomModal(!showCustomModal)}
                title="Choose custom days"
                disabled={loading}
                className={cn(
                  "h-6 px-2 rounded transition-all text-xs font-semibold flex items-center justify-center gap-1",
                  isCustomDays
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 disabled:opacity-50"
                )}
              >
                {isCustomDays && <span className="font-mono text-[11px]">{days}d</span>}
                <Pencil className="w-3 h-3" />
              </button>

              {/* Custom Days Mini Popover */}
              {showCustomModal && (
                <div className="absolute right-0 top-full mt-1.5 z-30 w-56 rounded-lg border border-slate-200 bg-white p-3 shadow-lg animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-800">Custom Days Window</span>
                    <button
                      onClick={() => setShowCustomModal(false)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] text-slate-500">Days to compare:</label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={customInputValue}
                        onChange={(e) => setCustomInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyCustomDays()}
                        className="w-full mt-1 px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                        placeholder="e.g. 14"
                        autoFocus
                      />
                    </div>
                    {/* Quick presets */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {[5, 14, 30].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setCustomInputValue(String(preset));
                          }}
                          className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                          {preset}d
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleApplyCustomDays}
                      className="w-full mt-2 py-1 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Apply Window
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Export CSV button */}
            <button
              onClick={handleExportCSV}
              title="Export report as CSV"
              className="h-7 px-2.5 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3 h-3 text-slate-500" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Controls Bar: Search & Category Filter */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${isOutward ? "outward" : "inward"} by SKU, product name, brand...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200/90 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown & Items Count */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="h-7 px-2 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
            >
              <option value="ALL">All Categories ({data.items.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <span className="text-[11px] text-slate-400 font-mono">
              {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
            </span>
          </div>
        </div>

        {/* 3. Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold text-slate-600 uppercase tracking-wider select-none">
                <th
                  onClick={() => toggleSort("category")}
                  className="py-2.5 px-3.5 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Category</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("brand")}
                  className="py-2.5 px-3.5 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Brand</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("name")}
                  className="py-2.5 px-3.5 cursor-pointer hover:text-slate-900 transition-colors min-w-[240px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("sku")}
                  className="py-2.5 px-3.5 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>SKU</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("change_qty")}
                  className="py-2.5 px-3.5 cursor-pointer hover:text-slate-900 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{isOutward ? "Dispatched Qty" : "Inward Qty"}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("current_stock")}
                  className="py-2.5 px-3.5 cursor-pointer hover:text-slate-900 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Current Stock</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-[13px] leading-5">
              {loading ? (
                // Loading Skeleton Rows
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-2.5 px-3.5">
                      <div className="h-4 bg-slate-200 rounded w-20" />
                    </td>
                    <td className="py-2.5 px-3.5">
                      <div className="h-4 bg-slate-200 rounded w-16" />
                    </td>
                    <td className="py-2.5 px-3.5">
                      <div className="h-4 bg-slate-200 rounded w-48" />
                    </td>
                    <td className="py-2.5 px-3.5">
                      <div className="h-4 bg-slate-200 rounded w-28" />
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="h-4 bg-slate-200 rounded w-16 ml-auto" />
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="h-4 bg-slate-200 rounded w-16 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : paginatedItems.length > 0 ? (
                paginatedItems.map((item) => (
                  <tr
                    key={item.sku}
                    className="hover:bg-slate-50/80 transition-colors group h-9"
                  >
                    {/* Category */}
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <span className="inline-block text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {item.category || "—"}
                      </span>
                    </td>

                    {/* Brand */}
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <span className="font-semibold text-slate-700 text-xs">
                        {item.brand || "—"}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-2 px-3.5 max-w-[320px]">
                      <span
                        className="truncate block font-medium text-slate-900 text-xs"
                        title={item.name}
                      >
                        {item.name}
                      </span>
                    </td>

                    {/* SKU */}
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60 font-medium">
                        {item.sku}
                      </span>
                    </td>

                    {/* Dispatched Qty or Inward Qty (Right Aligned) */}
                    <td className="py-2 px-3.5 text-right whitespace-nowrap">
                      <span
                        className={cn(
                          "font-mono font-bold text-xs px-2 py-0.5 rounded border",
                          isOutward
                            ? "bg-rose-50 text-rose-700 border-rose-200/70"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                        )}
                      >
                        {isOutward ? `-${formatNumber(item.change_qty)}` : `+${formatNumber(item.change_qty)}`}
                      </span>
                    </td>

                    {/* Current Stock (Right Aligned) */}
                    <td className="py-2 px-3.5 text-right whitespace-nowrap font-mono font-semibold text-slate-900 text-xs">
                      {formatNumber(item.current_stock)}
                    </td>
                  </tr>
                ))
              ) : (
                // Empty / No Results State
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                        <AlertCircle className="w-4 h-4 text-slate-400" />
                      </div>
                      <h4 className="text-xs font-semibold text-slate-700">
                        {searchQuery || selectedCategory !== "ALL"
                          ? `No ${isOutward ? "outward" : "inward"} materials match filters`
                          : `No ${isOutward ? "outward" : "inward"} activity detected in this ${days}-day window`}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {searchQuery || selectedCategory !== "ALL"
                          ? "Try clearing search or changing the category filter."
                          : `Inventory stock levels remained constant or moved in the opposite direction between ${formatDate(prevDate)} and ${formatDate(latestDate)}.`}
                      </p>
                      {(searchQuery || selectedCategory !== "ALL") && (
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory("ALL");
                          }}
                          className="mt-3 px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Sleek Pagination */}
        {filteredItems.length > pageSize && (
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * pageSize, filteredItems.length)}
              </span>{" "}
              of <span className="font-semibold text-slate-800">{filteredItems.length}</span> SKUs
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 px-2 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <span className="text-[11px] px-2 font-mono text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 px-2 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
