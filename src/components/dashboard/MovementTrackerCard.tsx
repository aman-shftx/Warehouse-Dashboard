"use client";

import { useState, useMemo } from "react";
import { 
  Search, 
  X, 
  Calendar,
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
import { MovementItem, MovementSectionData, MovementDataResponse } from "@/lib/movement";
import { MovementSparkline } from "./MovementSparkline";

function getYesterdayIST(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });
  const todayIST = formatter.format(new Date());
  const d = new Date(todayIST + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return formatter.format(d);
}

function getTodayIST(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });
  return formatter.format(new Date());
}

function stepDate(dateStr: string, deltaDays: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + deltaDays);
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });
  return formatter.format(d);
}

function formatDisplayDateRange(start: string, end: string): string {
  if (!start) return "";
  if (start === end || !end) return formatDate(start);
  const startFmt = formatDate(start);
  const endFmt = formatDate(end);
  const sParts = startFmt.split(" ");
  const eParts = endFmt.split(" ");
  if (sParts.length === 3 && eParts.length === 3) {
    if (sParts[2] === eParts[2] && sParts[1] === eParts[1]) {
      return `${sParts[0]}–${eParts[0]} ${sParts[1]} ${sParts[2]}`;
    }
    if (sParts[2] === eParts[2]) {
      return `${sParts[0]} ${sParts[1]} – ${eParts[0]} ${eParts[1]} ${sParts[2]}`;
    }
  }
  return `${startFmt} → ${endFmt}`;
}

interface Props {
  type: "outward" | "inward";
  initialData: MovementSectionData;
  initialDays: number;
  latestDate: string | null;
  prevDate: string | null;
  highlighted?: boolean;
}

export function MovementTrackerCard({
  type,
  initialData,
  initialDays,
  latestDate: serverLatestDate,
  prevDate: serverPrevDate,
  highlighted = false,
}: Props) {
  const isOutward = type === "outward";

  // Unified Date selection state (Single Date if start === end, Range if start !== end)
  const defaultDate = serverLatestDate || getYesterdayIST();
  const [selectedStartDate, setSelectedStartDate] = useState<string>(serverPrevDate || defaultDate);
  const [selectedEndDate, setSelectedEndDate] = useState<string>(serverLatestDate || defaultDate);
  const [days, setDays] = useState<number>(initialDays);

  const isRange = selectedStartDate !== selectedEndDate;
  const isDateChanged = selectedStartDate !== defaultDate || selectedEndDate !== defaultDate;

  // Popover form states
  const [showPickerModal, setShowPickerModal] = useState<boolean>(false);
  const [tempStart, setTempStart] = useState<string>(serverPrevDate || defaultDate);
  const [tempEnd, setTempEnd] = useState<string>(serverLatestDate || defaultDate);

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
  const [isExpandedTo14, setIsExpandedTo14] = useState<boolean>(false);
  const pageSize = isExpandedTo14 ? 14 : 7;

  // Fetch updated data from API
  async function fetchMovement(params: { date?: string; startDate?: string; endDate?: string }) {
    setLoading(true);
    try {
      let query = "";
      if (params.date) {
        query = `date=${params.date}`;
      } else if (params.startDate && params.endDate) {
        query = `startDate=${params.startDate}&endDate=${params.endDate}`;
      }
      const res = await fetch(`/api/inventory-movement?${query}`);
      if (!res.ok) throw new Error("Failed to fetch movement data");
      const json: MovementDataResponse = await res.json();

      setLatestDate(json.latestDate);
      setPrevDate(json.prevDate);
      setDays(json.days);
      setData(isOutward ? json.outward : json.inward);
      setCurrentPage(1);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleApply = (start: string, end: string) => {
    if (!start) return;
    const finalEnd = end || start;
    const [finalStart, cleanEnd] = start <= finalEnd ? [start, finalEnd] : [finalEnd, start];

    setSelectedStartDate(finalStart);
    setSelectedEndDate(cleanEnd);
    setTempStart(finalStart);
    setTempEnd(cleanEnd);
    setShowPickerModal(false);

    if (finalStart === cleanEnd) {
      fetchMovement({ date: finalStart });
    } else {
      fetchMovement({ startDate: finalStart, endDate: cleanEnd });
    }
  };

  const handleResetToDefault = () => {
    setSelectedStartDate(defaultDate);
    setSelectedEndDate(defaultDate);
    setTempStart(defaultDate);
    setTempEnd(defaultDate);
    setShowPickerModal(false);
    fetchMovement({ date: defaultDate });
  };

  const handlePrevDay = () => {
    if (!isRange) {
      const prev = stepDate(selectedStartDate, -1);
      handleApply(prev, prev);
    } else {
      const newStart = stepDate(selectedStartDate, -1);
      const newEnd = stepDate(selectedEndDate, -1);
      handleApply(newStart, newEnd);
    }
  };

  const handleNextDay = () => {
    if (!isRange) {
      const next = stepDate(selectedStartDate, 1);
      if (next <= getTodayIST()) {
        handleApply(next, next);
      }
    } else {
      const newEnd = stepDate(selectedEndDate, 1);
      if (newEnd <= getTodayIST()) {
        const newStart = stepDate(selectedStartDate, 1);
        handleApply(newStart, newEnd);
      }
    }
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
    const periodLabel = isRange
      ? `${selectedStartDate} to ${selectedEndDate}`
      : `${selectedStartDate}`;

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
      `"${periodLabel}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${type}-materials-${isRange ? `${selectedStartDate}_to_${selectedEndDate}` : selectedStartDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Unified styling for table rows
  const theme = {
    tableHeader: "bg-slate-50/70 border-slate-200/80 text-slate-600",
    rowHover: "hover:bg-slate-50/60",
    qtyText: isOutward ? "text-rose-700" : "text-emerald-700",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-lg border shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col h-full relative transition-all",
        highlighted
          ? isOutward
            ? "border-indigo-500 ring-2 ring-indigo-500"
            : "border-emerald-500 ring-2 ring-emerald-500"
          : "border-slate-200/90"
      )}
    >
      {/* 1. Master Card Header: Standardized 2-Tier Layout for Inward & Outward */}
      <div className="p-3 border-b border-slate-100 bg-white space-y-2.5 rounded-t-lg">
        {/* Tier 1: Title & Flow Tag (Left) + Date Navigation & CSV Export (Right) */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Heading with Flow Tag */}
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">
              {isOutward ? "Material Outward" : "Material Inward"}
            </h2>
            <span
              className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wider",
                isOutward
                  ? "bg-slate-100 text-slate-700 border-slate-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200/80"
              )}
            >
              {isOutward ? "Outward" : "Inward"}
            </span>
          </div>

          {/* Right: Date Controls & CSV Export */}
          <div className="flex items-center gap-1.5 shrink-0 relative">
            {/* Reset button if date is changed */}
            {isDateChanged && (
              <button
                type="button"
                onClick={handleResetToDefault}
                disabled={loading}
                title={`Reset to default (${formatDate(defaultDate)})`}
                className="h-6 px-2 text-[10px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded flex items-center gap-1 transition-all"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset</span>
              </button>
            )}

            {/* Active Date Trigger Button */}
            <div className="inline-flex items-center rounded-md border border-slate-200 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevDay}
                disabled={loading}
                title="Previous day"
                className="h-6 w-6 rounded hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setShowPickerModal(!showPickerModal)}
                title="Click to select single date or date range"
                disabled={loading}
                className={cn(
                  "h-6 px-2 text-[11px] font-mono font-semibold rounded flex items-center gap-1.5 transition-colors",
                  showPickerModal ? "bg-slate-100 text-slate-900" : "text-slate-800 hover:bg-slate-50"
                )}
              >
                <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="whitespace-nowrap">
                  {formatDisplayDateRange(selectedStartDate, selectedEndDate)}
                </span>
                <ChevronDown className="w-2.5 h-2.5 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={handleNextDay}
                disabled={loading || (isRange ? selectedEndDate >= getTodayIST() : selectedStartDate >= getTodayIST())}
                title="Next day"
                className="h-6 w-6 rounded hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Export CSV button */}
            <button
              type="button"
              onClick={handleExportCSV}
              title="Export CSV"
              className="h-7 w-7 rounded-md border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center shadow-2xs transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Unified Date & Range Selector Popover */}
            {showPickerModal && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-[0.5px]"
                  onClick={() => setShowPickerModal(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-50 w-[305px] sm:w-[325px] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      Select Date or Range
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isDateChanged && (
                        <button
                          type="button"
                          onClick={handleResetToDefault}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/60"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          Reset
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPickerModal(false)}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Clear Guidance / Hint Banner */}
                  <div className="mb-2.5 p-2 rounded-md bg-amber-50/80 border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-1.5 leading-snug">
                    <span className="shrink-0 text-xs">💡</span>
                    <span>
                      <strong>Hint:</strong> Pick a single date for a <strong>fixed day</strong>, or choose both <strong>From</strong> & <strong>To</strong> dates to view a <strong>date range</strong>.
                    </span>
                  </div>

                  {/* Date Inputs */}
                  <div className="space-y-2.5 mb-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                          From Date
                        </label>
                        <input
                          type="date"
                          value={tempStart}
                          max={getTodayIST()}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTempStart(val);
                            if (tempEnd && val && tempEnd < val) {
                              setTempEnd(val);
                            }
                          }}
                          className="w-full h-8 px-2 text-[11px] font-mono font-medium border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            To Date
                          </label>
                          {tempStart !== tempEnd && (
                            <button
                              type="button"
                              onClick={() => setTempEnd(tempStart)}
                              className="text-[10px] text-indigo-600 hover:underline font-medium"
                            >
                              Single Day
                            </button>
                          )}
                        </div>
                        <input
                          type="date"
                          value={tempEnd}
                          min={tempStart}
                          max={getTodayIST()}
                          onChange={(e) => setTempEnd(e.target.value)}
                          className="w-full h-8 px-2 text-[11px] font-mono font-medium border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                        />
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Quick Presets
                        </span>
                        {isDateChanged && (
                          <button
                            type="button"
                            onClick={handleResetToDefault}
                            className="text-[10px] text-indigo-600 hover:underline font-medium"
                          >
                            Default (Yesterday)
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const y = getYesterdayIST();
                            setTempStart(y);
                            setTempEnd(y);
                            handleApply(y, y);
                          }}
                          className={cn(
                            "py-1 text-[10px] rounded border font-semibold transition-colors",
                            tempStart === getYesterdayIST() && tempEnd === getYesterdayIST()
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          Yesterday (T-1)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const db = stepDate(getYesterdayIST(), -1);
                            setTempStart(db);
                            setTempEnd(db);
                            handleApply(db, db);
                          }}
                          className={cn(
                            "py-1 text-[10px] rounded border font-semibold transition-colors",
                            tempStart === stepDate(getYesterdayIST(), -1) && tempEnd === stepDate(getYesterdayIST(), -1)
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          Day Before
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const end = getYesterdayIST();
                            const start = stepDate(end, -2);
                            setTempStart(start);
                            setTempEnd(end);
                            handleApply(start, end);
                          }}
                          className={cn(
                            "py-1 text-[10px] rounded border font-semibold transition-colors",
                            tempStart === stepDate(getYesterdayIST(), -2) && tempEnd === getYesterdayIST()
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          Last 3 Days
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const end = getYesterdayIST();
                            const start = stepDate(end, -6);
                            setTempStart(start);
                            setTempEnd(end);
                            handleApply(start, end);
                          }}
                          className={cn(
                            "py-1 text-[10px] rounded border font-semibold transition-colors",
                            tempStart === stepDate(getYesterdayIST(), -6) && tempEnd === getYesterdayIST()
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          Last 7 Days
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const end = getYesterdayIST();
                            const start = stepDate(end, -13);
                            setTempStart(start);
                            setTempEnd(end);
                            handleApply(start, end);
                          }}
                          className={cn(
                            "py-1 text-[10px] rounded border font-semibold transition-colors",
                            tempStart === stepDate(getYesterdayIST(), -13) && tempEnd === getYesterdayIST()
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          Last 14 Days
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const end = getYesterdayIST();
                            const start = stepDate(end, -29);
                            setTempStart(start);
                            setTempEnd(end);
                            handleApply(start, end);
                          }}
                          className={cn(
                            "py-1 text-[10px] rounded border font-semibold transition-colors",
                            tempStart === stepDate(getYesterdayIST(), -29) && tempEnd === getYesterdayIST()
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          Last 30 Days
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Apply Action Button */}
                  <button
                    type="button"
                    onClick={() => handleApply(tempStart, tempEnd)}
                    disabled={loading || !tempStart}
                    className="w-full h-8 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {tempStart === tempEnd || !tempEnd
                      ? `Apply: ${formatDate(tempStart)} (Single Day)`
                      : `Apply Range (${formatDate(tempStart)} → ${formatDate(tempEnd)})`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tier 2: Date Context Subtitle (Left) + Standardized SKUs & Units Metrics (Right) */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          {/* Left: Detailed Date Span & Badge */}
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 min-w-0">
            <span className="truncate">
              {isRange
                ? `${formatDate(selectedStartDate)} → ${formatDate(selectedEndDate)}`
                : formatDate(selectedStartDate)}
            </span>
            <span className="font-sans font-medium text-[9px] px-1.5 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-200/80 shrink-0">
              {isRange ? `${days}d Range` : "Fixed Day"}
            </span>
          </div>

          {/* Right: Uniform Stat Badges */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Total SKUs */}
            <div className="flex items-baseline gap-1 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] min-w-[70px] justify-center">
              <span className="text-sm sm:text-base font-bold font-mono text-slate-900 leading-none">
                {formatNumber(data.totalSkus)}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 font-sans uppercase tracking-wider">
                SKUs
              </span>
            </div>

            {/* Total Units */}
            <div className="flex items-baseline gap-1 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] min-w-[75px] justify-center">
              <span className="text-sm sm:text-base font-bold font-mono text-slate-900 leading-none">
                {formatNumber(data.totalQty)}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 font-sans uppercase tracking-wider">
                Units
              </span>
            </div>
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

              {/* Combined Name & SKU Stacked (38%) */}
              <th
                onClick={() => toggleSort("name")}
                className="py-2 px-3 cursor-pointer hover:text-slate-900 transition-colors w-[38%]"
              >
                <div className="flex items-center gap-1">
                  <div className="flex flex-col leading-[11px]">
                    <span className="text-[10px] font-bold tracking-tight truncate">NAME / TITLE</span>
                    <span className="text-[9px] text-slate-400 font-medium">SKU CODE</span>
                  </div>
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                </div>
              </th>

              {/* Dispatched Qty / Inward Qty (14% - Stacked Header) */}
              <th
                onClick={() => toggleSort("change_qty")}
                className="py-2 px-3 cursor-pointer hover:text-slate-900 transition-colors text-right w-[14%]"
              >
                <div className="flex items-center justify-end gap-1">
                  <div className="flex flex-col text-right leading-[11px]">
                    <span className="text-[10px] font-bold tracking-tight">{isOutward ? "DISPATCH" : "INWARD"}</span>
                    <span className="text-[9px] text-slate-400 font-medium">QTY</span>
                  </div>
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                </div>
              </th>

              {/* Current Stock (14% - Stacked Header) */}
              <th
                onClick={() => toggleSort("current_stock")}
                className="py-2 px-3 cursor-pointer hover:text-slate-900 transition-colors text-right w-[14%]"
              >
                <div className="flex items-center justify-end gap-1">
                  <div className="flex flex-col text-right leading-[11px]">
                    <span className="text-[10px] font-bold tracking-tight">CURRENT</span>
                    <span className="text-[9px] text-slate-400 font-medium">STOCK</span>
                  </div>
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                </div>
              </th>

              {/* Trend Sparkline (16%) */}
              <th className="py-2 px-2.5 text-right w-[16%]">
                <div className="flex flex-col text-right leading-[11px]">
                  <span className="text-[10px] font-bold tracking-tight">TREND</span>
                  <span className="text-[9px] text-slate-400 font-medium">{Math.max(14, days)}D FLOW</span>
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
                  <td className="py-2 px-3 text-right"><div className="h-4 bg-slate-200 rounded w-12 ml-auto" /></td>
                  <td className="py-2 px-3 text-right"><div className="h-4 bg-slate-200 rounded w-12 ml-auto" /></td>
                  <td className="py-2 px-2.5 text-right"><div className="h-4 bg-slate-200 rounded w-14 ml-auto" /></td>
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
                      <span className="font-medium text-slate-500 text-[10px] truncate" title={item.brand || ""}>
                        {item.brand || "—"}
                      </span>
                    </div>
                  </td>

                  {/* Combined Name on Top & SKU underneath (38%) */}
                  <td className="py-1.5 px-3 overflow-hidden align-middle">
                    <div className="flex flex-col min-w-0">
                      <span
                        className="truncate block font-medium text-slate-900 text-xs tracking-tight leading-snug"
                        title={item.name}
                      >
                        {item.name}
                      </span>
                      <span
                        className="truncate block font-mono text-[10px] text-slate-500 leading-tight mt-0.5"
                        title={item.sku}
                      >
                        {item.sku}
                      </span>
                    </div>
                  </td>

                  {/* Dispatched Qty or Inward Qty (14% - Right Aligned) */}
                  <td className="py-1.5 px-3 text-right overflow-hidden align-middle">
                    <span className={cn("font-mono font-bold text-xs block truncate", theme.qtyText)}>
                      {isOutward ? `-${formatNumber(item.change_qty)}` : `+${formatNumber(item.change_qty)}`}
                    </span>
                  </td>

                  {/* Current Stock (14% - Right Aligned) */}
                  <td className="py-1.5 px-3 text-right overflow-hidden align-middle">
                    <span className="font-mono font-semibold text-slate-800 text-xs block truncate">
                      {formatNumber(item.current_stock)}
                    </span>
                  </td>

                  {/* Trend Sparkline (16% - Right Aligned) */}
                  <td className="py-1.5 px-2.5 text-right overflow-hidden align-middle">
                    <MovementSparkline
                      data={item.trend || [item.prev_stock, item.current_stock]}
                      type={type}
                      days={Math.max(14, days)}
                      width={68}
                      height={22}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-14 px-4 text-center">
                  <div className="flex flex-col items-center justify-center max-w-xs mx-auto">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-semibold text-slate-700">
                      {searchQuery || selectedCategory !== "ALL"
                        ? `No ${isOutward ? "outward" : "inward"} materials match filters`
                        : `No ${isOutward ? "outward" : "inward"} activity for ${isRange ? `${formatDate(selectedStartDate)} → ${formatDate(selectedEndDate)}` : formatDate(selectedStartDate)}`}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {searchQuery || selectedCategory !== "ALL"
                        ? "Try clearing filters to see all materials."
                        : "No transactions were recorded on this date."}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      {(searchQuery || selectedCategory !== "ALL") && (
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory("ALL");
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset Filters
                        </button>
                      )}
                      {isDateChanged && (
                        <button
                          onClick={handleResetToDefault}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded transition-colors flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset to Yesterday
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Standardized Card Footer */}
      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs text-slate-500 mt-auto min-h-[36px] rounded-b-lg">
        {filteredItems.length > 0 ? (
          <>
            {/* Left: Item range and Expand to 14 icon button */}
            <div className="flex items-center gap-2">
              <span className="text-[11px]">
                <span className="font-semibold text-slate-800">
                  {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredItems.length)}
                </span>{" "}
                of <span className="font-semibold text-slate-800">{filteredItems.length}</span>
              </span>

              {filteredItems.length > 7 && (
                <button
                  onClick={() => {
                    setIsExpandedTo14(!isExpandedTo14);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "h-5 px-1.5 rounded border text-[10px] font-semibold flex items-center gap-1 transition-all",
                    isExpandedTo14
                      ? "bg-slate-200/90 text-slate-800 border-slate-300 hover:bg-slate-300"
                      : "bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900"
                  )}
                  title={isExpandedTo14 ? "Collapse to 7 rows" : "Expand to 14 rows"}
                >
                  {isExpandedTo14 ? (
                    <>
                      <ChevronUp className="w-2.5 h-2.5 text-slate-600" />
                      <span>7 rows</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-2.5 h-2.5 text-slate-600" />
                      <span>14 rows</span>
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
          </>
        ) : (
          <>
            <span className="text-[11px] text-slate-400">0 items listed</span>
            {isDateChanged && (
              <button
                onClick={handleResetToDefault}
                className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-medium"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Reset to default date
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
