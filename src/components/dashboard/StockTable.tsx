"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Search, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  X, 
  SlidersHorizontal,
  RotateCcw
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

export interface TableItem {
  sku_code: string;
  old_sku_code?: string | null;
  product_name: string | null;
  brand: string | null;
  category: string | null;
  sourcing: string | null;
  current_stock: number;
  required_qty: number;
  drr_7d?: number;
  latest_date?: string;
}

interface Props {
  items: TableItem[];
  categories: string[];
  sourcings: string[];
}

export function StockTable({ items, categories, sourcings }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("ALL");
  const [selectedSourcing, setSelectedSourcing] = useState("ALL");
  const [stockStatus, setStockStatus] = useState("ALL");
  const [sortKey, setSortKey] = useState<keyof TableItem>("sku_code");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 50;

  // Keyboard shortcut: Press "/" or "Ctrl+K" / "Cmd+K" to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.key === "/" && (e.target as HTMLElement).tagName !== "INPUT") ||
          ((e.metaKey || e.ctrlKey) && e.key === "k")) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setSearch("");
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleResetFilters() {
    setSearch("");
    setSelectedCat("ALL");
    setSelectedSourcing("ALL");
    setStockStatus("ALL");
    setSortKey("sku_code");
    setSortOrder("asc");
    setCurrentPage(1);
  }

  const hasActiveFilters = search.trim() !== "" || selectedCat !== "ALL" || selectedSourcing !== "ALL" || stockStatus !== "ALL";

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchSku = item.sku_code?.toLowerCase().includes(q);
        const matchOldSku = item.old_sku_code?.toLowerCase().includes(q);
        const matchName = item.product_name?.toLowerCase().includes(q);
        const matchBrand = item.brand?.toLowerCase().includes(q);
        if (!matchSku && !matchOldSku && !matchName && !matchBrand) return false;
      }

      if (selectedCat !== "ALL" && item.category !== selectedCat) return false;
      if (selectedSourcing !== "ALL" && item.sourcing !== selectedSourcing) return false;

      if (stockStatus === "OUT_OF_STOCK" && item.current_stock > 0) return false;
      if (stockStatus === "LOW_STOCK") {
        if (item.current_stock === 0) return false;
        if (item.required_qty > 0 && item.current_stock >= item.required_qty) return false;
        if (item.required_qty === 0) return false;
      }
      if (stockStatus === "IN_STOCK" && item.current_stock === 0) return false;

      return true;
    });
  }, [items, search, selectedCat, selectedSourcing, stockStatus]);

  // Sort items
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (valA === null || valA === undefined) valA = 0 as any;
      if (valB === null || valB === undefined) valB = 0 as any;

      if (typeof valA === "string") {
        return sortOrder === "asc"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      }

      return sortOrder === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [filteredItems, sortKey, sortOrder]);

  const totalPages = Math.ceil(sortedItems.length / pageSize) || 1;
  const paginatedItems = sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function toggleSort(key: keyof TableItem) {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  }

  function getSourcingBadge(sourcing: string | null) {
    const s = (sourcing || "").toUpperCase();
    if (!s) return <span className="text-slate-300">-</span>;
    return (
      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
        {s}
      </span>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200/80 flex flex-col">
      {/* Search & Filter Toolbar - Pattern 34: Search Experience System */}
      <div className="p-3 border-b border-slate-200/80 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2.5">
        {/* Search Bar with Keyboard Hint */}
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search SKU code, title, brand... (Press / to focus)"
            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md border border-slate-300/80 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-600 bg-white placeholder:text-slate-400 font-normal transition-all"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                searchInputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns - Clean, tight density */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <select
            value={selectedCat}
            onChange={(e) => {
              setSelectedCat(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 px-2.5 rounded-md border border-slate-300/80 bg-white text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedSourcing}
            onChange={(e) => {
              setSelectedSourcing(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 px-2.5 rounded-md border border-slate-300/80 bg-white text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Sourcing</option>
            {sourcings.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 px-2.5 rounded-md border border-slate-300/80 bg-white text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="IN_STOCK">In Stock (&gt; 0)</option>
            <option value="LOW_STOCK">Below Target</option>
            <option value="OUT_OF_STOCK">Out of Stock (0)</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 h-8 px-2 rounded-md text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Element - Rules: 13px text, 34px rows, right-align numbers with tabular figures */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/95 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 sticky top-0 z-10 select-none">
            <tr>
              <th 
                className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100/70 transition-colors text-left"
                onClick={() => toggleSort("sku_code")}
              >
                <div className="flex items-center gap-1">
                  <span>SKU Code</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th 
                className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100/70 transition-colors text-left"
                onClick={() => toggleSort("product_name")}
              >
                <div className="flex items-center gap-1">
                  <span>Product Title</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-left">Category</th>
              <th className="py-2.5 px-3 text-left">Sourcing</th>
              <th 
                className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100/70 transition-colors text-right"
                onClick={() => toggleSort("current_stock")}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Current Stock</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th 
                className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100/70 transition-colors text-right"
                onClick={() => toggleSort("required_qty")}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Target Qty</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[13px] leading-5 text-slate-700">
            {paginatedItems.length === 0 ? (
              /* Pattern 22: Empty State with recovery path */
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="text-xs font-semibold text-slate-700">No products match your criteria</p>
                    <p className="text-[11px] text-slate-400">
                      Try checking spelling or adjusting category and status filters.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear all filters</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const isOOS = item.current_stock === 0;
                const isLow = !isOOS && item.required_qty > 0 && item.current_stock < item.required_qty;

                return (
                  <tr key={item.sku_code} className="hover:bg-slate-50/80 transition-colors duration-100 group">
                    {/* SKU Code (Left-aligned, monospace) */}
                    <td className="py-2 px-3.5 font-mono text-[12px] font-semibold text-slate-900 whitespace-nowrap">
                      <Link 
                        href={`/product/${encodeURIComponent(item.sku_code)}`}
                        className="hover:text-indigo-600 hover:underline"
                      >
                        {item.sku_code}
                      </Link>
                      {item.old_sku_code && (
                        <div className="text-[10px] text-slate-400 font-normal font-mono truncate max-w-[180px]">
                          {item.old_sku_code}
                        </div>
                      )}
                    </td>

                    {/* Product Name & Brand (Left-aligned) */}
                    <td className="py-2 px-3.5 max-w-sm">
                      <div className="font-medium text-slate-800 truncate" title={item.product_name || ""}>
                        {item.product_name || "-"}
                      </div>
                      {item.brand && (
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                          {item.brand}
                        </div>
                      )}
                    </td>

                    {/* Category (Left-aligned) */}
                    <td className="py-2 px-3 text-slate-500 text-xs whitespace-nowrap">
                      {item.category || "-"}
                    </td>

                    {/* Sourcing (Left-aligned) */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      {getSourcingBadge(item.sourcing)}
                    </td>

                    {/* Current Stock (Rule: STRICTLY RIGHT-ALIGNED WITH TABULAR FIGURES) */}
                    <td className="py-2 px-3.5 text-right whitespace-nowrap font-mono tabular-nums text-xs">
                      <span className={`font-semibold ${isOOS ? "text-rose-600 font-bold" : isLow ? "text-amber-700 font-semibold" : "text-slate-900"}`}>
                        {formatNumber(item.current_stock)}
                      </span>
                    </td>

                    {/* Target Requirement (Rule: STRICTLY RIGHT-ALIGNED) */}
                    <td className="py-2 px-3.5 text-right whitespace-nowrap font-mono tabular-nums text-xs text-slate-400">
                      {item.required_qty > 0 ? formatNumber(item.required_qty) : "-"}
                    </td>

                    {/* Status Badge (Pattern 2: Muted, discreet status) */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      {isOOS ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-600 bg-slate-100">
                          In Stock
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <Link
                        href={`/product/${encodeURIComponent(item.sku_code)}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-indigo-600 transition-colors p-1"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar - Rule: Clear scannable status, disabled buttons with proper affordance */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
        <div className="tabular-nums">
          Showing <span className="font-semibold text-slate-800">{sortedItems.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{" "}
          <span className="font-semibold text-slate-800">{Math.min(currentPage * pageSize, sortedItems.length)}</span> of{" "}
          <span className="font-semibold text-slate-800">{formatNumber(sortedItems.length)}</span> products
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1 rounded border border-slate-300/80 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <span className="px-2 font-mono tabular-nums text-xs">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1 rounded border border-slate-300/80 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
