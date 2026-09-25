"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, ExternalLink, ShieldCheck, Factory, Store } from "lucide-react";
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
  const [sortKey, setSortKey] = useState<keyof TableItem>("current_stock");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchSku = item.sku_code?.toLowerCase().includes(q);
        const matchOldSku = item.old_sku_code?.toLowerCase().includes(q);
        const matchName = item.product_name?.toLowerCase().includes(q);
        const matchBrand = item.brand?.toLowerCase().includes(q);
        if (!matchSku && !matchOldSku && !matchName && !matchBrand) return false;
      }

      // Category
      if (selectedCat !== "ALL" && item.category !== selectedCat) {
        return false;
      }

      // Sourcing
      if (selectedSourcing !== "ALL" && item.sourcing !== selectedSourcing) {
        return false;
      }

      // Stock Status
      if (stockStatus === "OUT_OF_STOCK" && item.current_stock > 0) return false;
      if (stockStatus === "LOW_STOCK") {
        if (item.current_stock === 0) return false;
        if (item.required_qty > 0 && item.current_stock >= item.required_qty) return false;
        if (item.required_qty === 0 && item.current_stock > 10) return false;
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

  // Paginate
  const totalPages = Math.ceil(sortedItems.length / pageSize) || 1;
  const paginatedItems = sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function toggleSort(key: keyof TableItem) {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  }

  function getSourcingBadge(sourcing: string | null) {
    const s = (sourcing || "").toUpperCase();
    if (s === "ORIGINAL") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          ORIGINAL
        </span>
      );
    }
    if (s === "FACTORY") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Factory className="w-3 h-3 text-indigo-600" />
          FACTORY
        </span>
      );
    }
    if (s === "MARKET") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Store className="w-3 h-3 text-amber-600" />
          MARKET
        </span>
      );
    }
    return <span className="text-slate-400 text-xs">{sourcing || "-"}</span>;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Table Controls / Filters Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search SKU code, product, brand..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category */}
          <select
            value={selectedCat}
            onChange={(e) => {
              setSelectedCat(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Sourcing */}
          <select
            value={selectedSourcing}
            onChange={(e) => {
              setSelectedSourcing(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Sourcing</option>
            {sourcings.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Stock Status */}
          <select
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="IN_STOCK">In Stock (&gt; 0)</option>
            <option value="LOW_STOCK">Low Stock (Below Target)</option>
            <option value="OUT_OF_STOCK">Out of Stock (0)</option>
          </select>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-200/50" onClick={() => toggleSort("sku_code")}>
                <div className="flex items-center gap-1.5">
                  SKU Code
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-200/50" onClick={() => toggleSort("product_name")}>
                <div className="flex items-center gap-1.5">
                  Product Name
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Sourcing</th>
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-200/50 text-right" onClick={() => toggleSort("current_stock")}>
                <div className="flex items-center justify-end gap-1.5">
                  Current Stock
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-200/50 text-right" onClick={() => toggleSort("required_qty")}>
                <div className="flex items-center justify-end gap-1.5">
                  Target Qty
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                  No products found matching your search and filter criteria.
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const isOOS = item.current_stock === 0;
                const isLow = !isOOS && item.required_qty > 0 && item.current_stock < item.required_qty;

                return (
                  <tr key={item.sku_code} className="hover:bg-slate-50/80 transition-colors">
                    {/* SKU */}
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-700 whitespace-nowrap">
                      {item.sku_code}
                      {item.old_sku_code && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          Old: {item.old_sku_code}
                        </div>
                      )}
                    </td>

                    {/* Product Name & Brand */}
                    <td className="py-3 px-4 max-w-md">
                      <div className="font-medium text-slate-900 truncate" title={item.product_name || ""}>
                        {item.product_name || "-"}
                      </div>
                      {item.brand && (
                        <span className="inline-block mt-0.5 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                          Brand: {item.brand}
                        </span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {item.category || "Unassigned"}
                      </span>
                    </td>

                    {/* Sourcing */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getSourcingBadge(item.sourcing)}
                    </td>

                    {/* Current Stock */}
                    <td className="py-3 px-4 text-right font-semibold whitespace-nowrap">
                      <span
                        className={`text-sm ${
                          isOOS
                            ? "text-rose-600 font-bold"
                            : isLow
                            ? "text-amber-600 font-bold"
                            : "text-slate-900"
                        }`}
                      >
                        {formatNumber(item.current_stock)}
                      </span>
                    </td>

                    {/* Required Qty */}
                    <td className="py-3 px-4 text-right text-slate-500 whitespace-nowrap">
                      {item.required_qty ? formatNumber(item.required_qty) : "-"}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {isOOS ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          In Stock
                        </span>
                      )}
                    </td>

                    {/* View Details */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <Link
                        href={`/product/${encodeURIComponent(item.sku_code)}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 font-medium transition-colors"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing{" "}
          <span className="font-semibold text-slate-800">
            {sortedItems.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-slate-800">
            {Math.min(currentPage * pageSize, sortedItems.length)}
          </span>{" "}
          of <span className="font-semibold text-slate-800">{formatNumber(sortedItems.length)}</span> products
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
