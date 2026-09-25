"use client";

import { useState, useEffect, useRef } from "react";
import { StatsCards } from "./StatsCards";
import { StockChart } from "./StockChart";
import { StockTable, TableItem } from "./StockTable";
import { useSearch } from "@/components/layout/SearchContext";
import { X, Layers } from "lucide-react";

interface DataPoint {
  date: string;
  quantity: number;
}

interface StatsData {
  totalSKUs: number;
  totalStock: number;
  outOfStock: number;
  lowStock: number;
  categoriesCount: number;
  lastSyncedAt: string | null;
}

interface Props {
  items: TableItem[];
  stats: StatsData;
  categories: string[];
  sourcings: string[];
  initialTrendData: DataPoint[];
}

export function InventoryClientDashboard({
  items,
  stats,
  categories,
  sourcings,
  initialTrendData,
}: Props) {
  const { searchQuery, setSearchQuery } = useSearch();
  const [skuTrend, setSkuTrend] = useState<{
    sku: string;
    productName: string;
    data: DataPoint[];
  } | null>(null);
  const [loadingSku, setLoadingSku] = useState(false);
  const cacheRef = useRef<Record<string, DataPoint[]>>({});

  // Check if search query matches an exact SKU
  useEffect(() => {
    const trimmed = searchQuery.trim().toUpperCase();
    if (!trimmed) {
      setSkuTrend(null);
      return;
    }

    // Check exact match by sku_code or old_sku_code
    const matchedItem = items.find(
      (item) =>
        item.sku_code.toUpperCase() === trimmed ||
        (item.old_sku_code && item.old_sku_code.toUpperCase() === trimmed)
    );

    if (matchedItem) {
      const targetSku = matchedItem.sku_code;

      // Check cache first
      if (cacheRef.current[targetSku]) {
        setSkuTrend({
          sku: targetSku,
          productName: matchedItem.product_name || targetSku,
          data: cacheRef.current[targetSku],
        });
        return;
      }

      setLoadingSku(true);
      fetch(`/api/sku-history?sku=${encodeURIComponent(targetSku)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.data) && data.data.length > 0) {
            cacheRef.current[targetSku] = data.data;
            setSkuTrend({
              sku: targetSku,
              productName: matchedItem.product_name || targetSku,
              data: data.data,
            });
          }
        })
        .catch((err) => {
          console.error("Failed to load SKU history:", err);
        })
        .finally(() => {
          setLoadingSku(false);
        });
    } else {
      setSkuTrend(null);
    }
  }, [searchQuery, items]);

  const isSkuActive = Boolean(skuTrend);

  return (
    <div className="space-y-4 max-w-[1500px] mx-auto">
      {/* KPI Stats Grid */}
      <StatsCards
        totalSKUs={stats.totalSKUs}
        totalStock={stats.totalStock}
        outOfStock={stats.outOfStock}
        lowStock={stats.lowStock}
        categoriesCount={stats.categoriesCount}
        lastSyncedAt={stats.lastSyncedAt}
      />

      {/* Stock Trend Chart - Dynamic: SKU history when searched, or overall warehouse total */}
      <div className="relative">
        {isSkuActive && skuTrend && (
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                SKU History Active: {skuTrend.sku}
              </span>
              <span className="text-xs text-slate-400">
                Displaying daily stock history for this particular product
              </span>
            </div>
            <button
              onClick={() => setSearchQuery("")}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <span>Reset to warehouse total</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <StockChart
          data={skuTrend ? skuTrend.data : initialTrendData}
          title={
            skuTrend
              ? `Stock History Trend: ${skuTrend.sku}`
              : "Overall Warehouse Stock Volume"
          }
          subtitle={
            skuTrend
              ? `Daily stock records for ${skuTrend.productName} (${skuTrend.data.length} dates)`
              : "Total units across all 345 SKUs over the 73 recorded dates"
          }
        />
      </div>

      {/* Inventory Catalog Table */}
      <div className="space-y-2">
        <div className="px-0.5">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Inventory Catalog</h2>
          <p className="text-[11px] text-slate-400">
            Live inventory mirrored from Google Sheets with tabular figures, multi-select filters, and instant SKU lookup.
          </p>
        </div>

        <StockTable
          items={items}
          categories={categories}
          sourcings={sourcings}
        />
      </div>
    </div>
  );
}
