"use client";

import { useState, useMemo } from "react";
import { 
  Search, 
  X, 
  Pencil, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Download, 
  ArrowUpDown, 
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

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<"change_qty" | "current_stock" | "name" | "sku" | "brand" | "category">("change_qty");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isExpandedTo10, setIsExpandedTo10] = useState<boolean>(false);
  const pageSize = isExpandedTo10 ? 10 : 5;

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

  // Unified color classes per card type
  const theme = isOutward
    ? {
        cardBorder: "border-slate-200/90",
        iconBox: "bg-rose-50/80 text-rose-700 border-rose-200/60",
        badge: "bg-rose-50 text-rose-700 border-rose-200/70",
        delayBadge: "bg-rose-50/60 text-rose-700 border-rose-200/50",
        daysActive: "bg-rose-700 text-white shadow-xs",
        daysHover: "hover:text-rose-700 hover:bg-rose-50/80",
        metricBox: "bg-rose-50/30 border-rose-100/80",
        metricLabel: "text-rose-900/60",
        metricVal: "text-rose-700",
        tableHeader: "bg-rose-50/30 border-rose-100/70 text-slate-600",
        qtyText: "text-rose-700",
        rowHover: "hover:bg-rose-50/25",
      }
    : {
        cardBorder: "border-slate-200/90",
        iconBox: "bg-emerald-50/80 text-emerald-700 border-emerald-200/60",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
        delayBadge: "bg-emerald-50/60 text-emerald-700 border-emerald-200/50",
        daysActive: "bg-emerald-700 text-white shadow-xs",
        daysHover: "hover:text-emerald-700 hover:bg-emerald-50/80",
        metricBox: "bg-emerald-50/30 border-emerald-100/80",
        metricLabel: "text-emerald-900/60",
        metricVal: "text-emerald-700",
        tableHeader: "bg-emerald-50/30 border-emerald-100/70 text-slate-600",
        qtyText: "text-emerald-700",
        rowHover: "hover:bg-emerald-50/25",
      };

  return (
    <div className={cn("bg-white rounded-lg border shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col h-full", theme.cardBorder)}>
      {/* 1. Master Card Header with Title on Left, Centered Metrics, and Controls on Right */}
      <div className="p-3 border-b border-slate-100 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: Heading with Date below it */}
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">
              {isOutward ? "Material Outward" : "Material Inward"}
            </h2>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
              <span>{formatDate(prevDate)} → {formatDate(latestDate)}</span>
              <span className={cn("font-sans font-medium text-[9px] px-1 py-0.2 rounded border", theme.delayBadge)}>
                T-1 Delay
              </span>
            </p>
          </div>

          {/* Center: Number of SKUs and Total Quantities in the center */}
          <div className="flex items-center gap-1.5 shrink-0 justify-center">
            <div className="flex items-baseline gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-mono font-semibold border border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span>{formatNumber(data.totalSkus)}</span>
              <span className="text-[10px] text-slate-500 font-sans font-normal">SKUs</span>
            </div>

            <div
              className={cn(
                "flex items-baseline gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold border shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
                isOutward
                  ? "bg-rose-50 text-rose-700 border-rose-200/70"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200/70"
              )}
            >
              <span>{isOutward ? `-${formatNumber(data.totalQty)}` : `+${formatNumber(data.totalQty)}`}</span>
              <span className="text-[10px] font-sans font-normal">Units</span>
            </div>
          </div>

          {/* Right: Days Selector & Export CSV */}
          <div className="flex items-center gap-1 shrink-0 justify-end">
            <div className="relative inline-flex items-center rounded-md border border-slate-200 bg-slate-50/80 p-0.5 text-xs font-medium">
              {[1, 3, 7].map((d) => (
                <button
                  key={d}
                  onClick={() => handleSelectDays(d)}
                  disabled={loading}
                  className={cn(
                    "h-6 min-w-[24px] px-1.5 rounded transition-all text-[11px] font-semibold flex items-center justify-center",
                    days === d && !isCustomDays
                      ? theme.daysActive
                      : cn("text-slate-600 hover:text-slate-900", theme.daysHover)
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
                    ? theme.daysActive
                    : cn("text-slate-600 hover:text-slate-900", theme.daysHover)
                )}
              >
                {isCustomDays && <span className="font-mono text-[10px]">{days}d</span>}
                <Pencil className="w-2.5 h-2.5" />
              </button>

              {/* Custom Days Popover */}
              {showCustomModal && (
                <div className="absolute right-0 top-full mt-1.5 z-30 w-48 rounded-lg border border-slate-200 bg-white p-2.5 shadow-lg animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-800">Custom Window</span>
                    <button
                      onClick={() => setShowCustomModal(false)}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={customInputValue}
                      onChange={(e) => setCustomInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCustomDays()}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 font-mono"
                      placeholder="e.g. 14"
                      autoFocus
                    />
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
                      className={cn(
                        "w-full py-1 text-xs font-semibold text-white rounded transition-colors flex items-center justify-center gap-1",
                        isOutward ? "bg-rose-700 hover:bg-rose-800" : "bg-emerald-700 hover:bg-emerald-800"
                      )}
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
              className="h-6 w-6 rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center transition-colors"
            >
              <Download className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Controls Bar: Search & Category Filter */}
      <div className="p-2.5 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between gap-2">
        <div className="relative flex-1 max-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${isOutward ? "outward" : "inward"} materials...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-7 pr-6 py-1 text-xs bg-white border border-slate-200/90 rounded focus:outline-none focus:ring-1 transition-all placeholder:text-slate-400 h-7"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="h-7 px-2 text-xs bg-white border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-1 font-medium max-w-[150px] truncate"
          >
            <option value="ALL">All Categories ({data.items.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <span className="text-[11px] text-slate-400 font-mono">
            {filteredItems.length}
          </span>
        </div>
      </div>

      {/* 4. Non-Scrollable Data Table with Category stacked over Brand */}
      <div className="w-full overflow-hidden flex-1">
        <table className="w-full table-fixed border-collapse text-left">
          <thead>
            <tr className={cn("border-b text-[11px] font-semibold uppercase tracking-wider select-none", theme.tableHeader)}>
              {/* Combined Category & Brand Stacked (18%) */}
              <th
                onClick={() => toggleSort("category")}
                className="py-2 px-3 cursor-pointer hover:text-slate-900 transition-colors w-[18%]"
              >
                <div className="flex items-center gap-1">
                  <div className="flex flex-col leading-[11px]">
                    <span className="text-[10px] font-bold tracking-tight">CATEGORY</span>
                    <span className="text-[9px] text-slate-400 font-medium">BRAND</span>
                  </div>
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                </div>
              </th>

              {/* Name / Product Title (36%) */}
              <th
                onClick={() => toggleSort("name")}
                className="py-2 px-3 cursor-pointer hover:text-slate-900 transition-colors w-[36%]"
              >
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold tracking-tight truncate">NAME / TITLE</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                </div>
              </th>

              {/* SKU Code (22%) */}
              <th
                onClick={() => toggleSort("sku")}
                className="py-2 px-3 cursor-pointer hover:text-slate-900 transition-colors w-[22%]"
              >
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold tracking-tight truncate">SKU CODE</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                </div>
              </th>

              {/* Dispatched Qty / Inward Qty (12% - Stacked Header) */}
              <th
                onClick={() => toggleSort("change_qty")}
                className="py-2 px-3 cursor-pointer hover:text-slate-900 transition-colors text-right w-[12%]"
              >
                <div className="flex items-center justify-end gap-1">
                  <div className="flex flex-col text-right leading-[11px]">
                    <span className="text-[10px] font-bold tracking-tight">{isOutward ? "DISPATCH" : "INWARD"}</span>
                    <span className="text-[9px] text-slate-400 font-medium">QTY</span>
                  </div>
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                </div>
              </th>

              {/* Current Stock (12% - Stacked Header: CURRENT over STOCK) */}
              <th
                onClick={() => toggleSort("current_stock")}
                className="py-2 px-3 cursor-pointer hover:text-slate-900 transition-colors text-right w-[12%]"
              >
                <div className="flex items-center justify-end gap-1">
                  <div className="flex flex-col text-right leading-[11px]">
                    <span className="text-[10px] font-bold tracking-tight">CURRENT</span>
                    <span className="text-[9px] text-slate-400 font-medium">STOCK</span>
                  </div>
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-[12px] leading-5">
            {loading ? (
              Array.from({ length: pageSize }).map((_, idx) => (
                <tr key={idx} className="animate-pulse h-10">
                  <td className="py-2 px-3"><div className="h-4 bg-slate-200 rounded w-full" /></td>
                  <td className="py-2 px-3"><div className="h-4 bg-slate-200 rounded w-full" /></td>
                  <td className="py-2 px-3"><div className="h-4 bg-slate-200 rounded w-full" /></td>
                  <td className="py-2 px-3 text-right"><div className="h-4 bg-slate-200 rounded w-12 ml-auto" /></td>
                  <td className="py-2 px-3 text-right"><div className="h-4 bg-slate-200 rounded w-12 ml-auto" /></td>
                </tr>
              ))
            ) : paginatedItems.length > 0 ? (
              paginatedItems.map((item) => (
                <tr
                  key={item.sku}
                  className={cn("transition-colors group h-10", theme.rowHover)}
                >
                  {/* Combined Category & Brand Stacked (18%) */}
                  <td className="py-1.5 px-3 overflow-hidden align-middle">
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-slate-800 text-[11px] truncate uppercase tracking-tight" title={item.category || ""}>
                        {item.category || "—"}
                      </span>
                      <span className="font-medium text-slate-500 text-[11px] truncate" title={item.brand || ""}>
                        {item.brand || "—"}
                      </span>
                    </div>
                  </td>

                  {/* Name (36%) */}
                  <td className="py-1.5 px-3 overflow-hidden align-middle">
                    <span
                      className="truncate block font-medium text-slate-900 text-xs tracking-tight"
                      title={item.name}
                    >
                      {item.name}
                    </span>
                  </td>

                  {/* SKU (22%) */}
                  <td className="py-1.5 px-3 overflow-hidden align-middle">
                    <span
                      className="truncate block font-mono text-[11px] text-slate-600 bg-slate-100/70 px-1.5 py-0.5 rounded border border-slate-200/50 w-fit max-w-full font-medium"
                      title={item.sku}
                    >
                      {item.sku}
                    </span>
                  </td>

                  {/* Dispatched Qty or Inward Qty (12% - Right Aligned) */}
                  <td className="py-1.5 px-3 text-right overflow-hidden align-middle">
                    <span className={cn("font-mono font-bold text-xs block truncate", theme.qtyText)}>
                      {isOutward ? `-${formatNumber(item.change_qty)}` : `+${formatNumber(item.change_qty)}`}
                    </span>
                  </td>

                  {/* Current Stock (12% - Right Aligned) */}
                  <td className="py-1.5 px-3 text-right overflow-hidden align-middle">
                    <span className="font-mono font-semibold text-slate-800 text-xs block truncate">
                      {formatNumber(item.current_stock)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 px-3 text-center">
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
                        className="mt-2 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1"
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

      {/* 5. Footer with Expand to 10 rows toggle icon and side pagination buttons */}
      {filteredItems.length > 0 && (
        <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs text-slate-500 mt-auto">
          {/* Left: Item range and Expand to 10 icon button */}
          <div className="flex items-center gap-2">
            <span className="text-[11px]">
              <span className="font-semibold text-slate-800">
                {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredItems.length)}
              </span>{" "}
              of <span className="font-semibold text-slate-800">{filteredItems.length}</span>
            </span>

            {filteredItems.length > 5 && (
              <button
                onClick={() => {
                  setIsExpandedTo10(!isExpandedTo10);
                  setCurrentPage(1);
                }}
                className={cn(
                  "h-5 px-1.5 rounded border text-[10px] font-semibold flex items-center gap-1 transition-all",
                  isExpandedTo10
                    ? "bg-slate-200/90 text-slate-800 border-slate-300 hover:bg-slate-300"
                    : "bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900"
                )}
                title={isExpandedTo10 ? "Collapse to 5 rows" : "Expand to 10 rows"}
              >
                {isExpandedTo10 ? (
                  <>
                    <ChevronUp className="w-2.5 h-2.5 text-slate-600" />
                    <span>5 rows</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-2.5 h-2.5 text-slate-600" />
                    <span>10 rows</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right: Side Next and Prev Navigation Buttons */}
          {filteredItems.length > pageSize && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-6 px-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center transition-colors font-medium"
                title="Previous page"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-[11px] px-1 font-mono text-slate-500">
                {currentPage}/{totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-6 px-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center transition-colors font-medium"
                title="Next page"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
