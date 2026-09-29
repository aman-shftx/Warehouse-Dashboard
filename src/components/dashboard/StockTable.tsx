"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  SlidersHorizontal,
  RotateCcw
} from "lucide-react";
import { formatNumber, cn } from "@/lib/utils";
import { useSearch } from "@/components/layout/SearchContext";
import { MultiSelectFilter } from "./MultiSelectFilter";

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
  drr_14d?: number;
  days_of_stock?: number;
  latest_date?: string;
}

interface Props {
  items: TableItem[];
  categories: string[];
  sourcings: string[];
}

export function StockTable({ items, categories, sourcings }: Props) {
  const { searchQuery, setSearchQuery } = useSearch();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSourcings, setSelectedSourcings] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<keyof TableItem>("sku_code");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Compute option counts for multi-selects
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((item) => {
      if (item.category) {
        map[item.category] = (map[item.category] || 0) + 1;
      }
    });
    return map;
  }, [items]);

  const sourcingCounts = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((item) => {
      if (item.sourcing) {
        map[item.sourcing] = (map[item.sourcing] || 0) + 1;
      }
    });
    return map;
  }, [items]);

  const statusCounts = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    items.forEach((item) => {
      if (item.current_stock === 0) outOfStock++;
      else if (item.required_qty > 0 && item.current_stock < item.required_qty) lowStock++;
      else inStock++;
    });
    return {
      "In Stock": inStock,
      "Low Stock": lowStock,
      "Out of Stock": outOfStock,
    };
  }, [items]);

  function handleResetFilters() {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedSourcings([]);
    setSelectedStatuses([]);
    setSortKey("sku_code");
    setSortOrder("asc");
    setCurrentPage(1);
  }

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategories.length > 0 ||
    selectedSourcings.length > 0 ||
    selectedStatuses.length > 0;

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSku = item.sku_code?.toLowerCase().includes(q);
        const matchOldSku = item.old_sku_code?.toLowerCase().includes(q);
        const matchName = item.product_name?.toLowerCase().includes(q);
        const matchBrand = item.brand?.toLowerCase().includes(q);
        if (!matchSku && !matchOldSku && !matchName && !matchBrand) return false;
      }

      // 2. Multi-Select Categories
      if (selectedCategories.length > 0 && (!item.category || !selectedCategories.includes(item.category))) {
        return false;
      }

      // 3. Multi-Select Sourcing
      if (selectedSourcings.length > 0 && (!item.sourcing || !selectedSourcings.includes(item.sourcing))) {
        return false;
      }

      // 4. Multi-Select Stock Status
      if (selectedStatuses.length > 0) {
        const isOutOfStock = item.current_stock === 0;
        const isLowStock = item.required_qty > 0 && item.current_stock > 0 && item.current_stock < item.required_qty;
        const isInStock = item.current_stock > 0 && (item.required_qty === 0 || item.current_stock >= item.required_qty);

        let matchesStatus = false;
        if (selectedStatuses.includes("Out of Stock") && isOutOfStock) matchesStatus = true;
        if (selectedStatuses.includes("Low Stock") && isLowStock) matchesStatus = true;
        if (selectedStatuses.includes("In Stock") && isInStock) matchesStatus = true;

        if (!matchesStatus) return false;
      }

      return true;
    });
  }, [items, searchQuery, selectedCategories, selectedSourcings, selectedStatuses]);

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
      {/* Multi-Select Filter Toolbar */}
      <div className="p-3 border-b border-slate-200/80 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Multi-select dropdown filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Filters:</span>
          </div>

          <MultiSelectFilter
            title="Categories"
            options={categories}
            selected={selectedCategories}
            onChange={(vals) => {
              setSelectedCategories(vals);
              setCurrentPage(1);
            }}
            counts={categoryCounts}
            placeholder="Search category..."
          />

          <MultiSelectFilter
            title="Sourcing"
            options={sourcings}
            selected={selectedSourcings}
            onChange={(vals) => {
              setSelectedSourcings(vals);
              setCurrentPage(1);
            }}
            counts={sourcingCounts}
          />

          <MultiSelectFilter
            title="Stock Status"
            options={["In Stock", "Low Stock", "Out of Stock"]}
            selected={selectedStatuses}
            onChange={(vals) => {
              setSelectedStatuses(vals);
              setCurrentPage(1);
            }}
            counts={statusCounts}
          />

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300/80 transition-colors"
              title="Reset all filters and search"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Right: Matched count */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {searchQuery && (
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[11px] font-mono border border-indigo-200/60">
              Query: &ldquo;{searchQuery}&rdquo;
            </span>
          )}
          <span className="text-[11px]">
            Showing <strong className="font-mono text-slate-900">{filteredItems.length}</strong> of {items.length} SKUs
          </span>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/95 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 sticky top-0 z-10 select-none">
            <tr>
              <th
                onClick={() => toggleSort("sku_code")}
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>SKU Code</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("product_name")}
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Product Title</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Sourcing</th>
              <th
                onClick={() => toggleSort("drr_14d")}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>DRR (14D)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("current_stock")}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Current Stock</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("required_qty")}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Target Qty</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("days_of_stock")}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Cover</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[13px] leading-5 text-slate-700">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-xs text-slate-400">
                  <div className="space-y-1">
                    <p>No products match the selected filters or search.</p>
                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        className="text-indigo-600 hover:underline font-medium text-xs mt-1"
                      >
                        Reset search and filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const isOutOfStock = item.current_stock === 0;
                const isLowStock = item.required_qty > 0 && item.current_stock < item.required_qty;

                return (
                  <tr
                    key={item.sku_code}
                    className="hover:bg-slate-50/80 transition-colors duration-100 h-[34px]"
                  >
                    <td className="py-1.5 px-3 font-mono text-[12px] font-semibold text-slate-900 whitespace-nowrap">
                      <Link
                        href={`/product/${encodeURIComponent(item.sku_code)}`}
                        prefetch={true}
                        className="hover:text-indigo-600 hover:underline"
                      >
                        {item.sku_code}
                      </Link>
                      {item.old_sku_code && (
                        <div className="text-[10px] text-slate-400 font-mono font-normal">
                          {item.old_sku_code}
                        </div>
                      )}
                    </td>
                    <td className="py-1.5 px-3 max-w-sm truncate text-slate-800 font-medium" title={item.product_name || ""}>
                      {item.product_name || "-"}
                    </td>
                    <td className="py-1.5 px-3 text-slate-500 text-xs whitespace-nowrap">
                      {item.category || "-"}
                    </td>
                    <td className="py-1.5 px-3 whitespace-nowrap">
                      {getSourcingBadge(item.sourcing)}
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono tabular-nums font-semibold text-indigo-700 text-xs whitespace-nowrap">
                      {item.drr_14d !== undefined ? item.drr_14d : (item.drr_7d !== undefined ? item.drr_7d : "—")}
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 text-xs whitespace-nowrap">
                      {isOutOfStock ? (
                        <span className="text-rose-600 font-bold">0</span>
                      ) : (
                        formatNumber(item.current_stock)
                      )}
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono tabular-nums text-xs text-slate-500 whitespace-nowrap">
                      {item.required_qty ? formatNumber(item.required_qty) : "-"}
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono tabular-nums text-xs whitespace-nowrap">
                      {isOutOfStock ? (
                        <span className="text-rose-600 font-bold">0d</span>
                      ) : item.days_of_stock !== undefined ? (
                        item.days_of_stock >= 999 ? (
                          <span className="text-slate-400">∞</span>
                        ) : (
                          <span
                            className={cn(
                              "px-1 py-0.5 rounded text-[10px] font-semibold",
                              item.days_of_stock < 7
                                ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                                : item.days_of_stock < 15
                                ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                                : "text-slate-700"
                            )}
                          >
                            {Math.round(item.days_of_stock)}d
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-1.5 px-3 text-center whitespace-nowrap">
                      {isOutOfStock ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-3 text-right whitespace-nowrap">
                      <Link
                        href={`/product/${encodeURIComponent(item.sku_code)}`}
                        prefetch={true}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-indigo-600 transition-colors p-1"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-2.5 border-t border-slate-200/80 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="text-slate-500 text-[11px]">
          Showing {Math.min((currentPage - 1) * pageSize + 1, sortedItems.length)} to{" "}
          {Math.min(currentPage * pageSize, sortedItems.length)} of {sortedItems.length} items
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded border border-slate-300/80 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-slate-700 font-medium transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <span className="px-2 py-0.5 text-xs text-slate-600 font-mono">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded border border-slate-300/80 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-slate-700 font-medium transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
