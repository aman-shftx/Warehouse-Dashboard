import { supabaseAdmin } from "@/lib/supabase/server";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { StockTable } from "@/components/dashboard/StockTable";
import { StockChart } from "@/components/dashboard/StockChart";
import Link from "next/link";
import { ArrowRight, TrendingUp, AlertTriangle } from "lucide-react";

export const revalidate = 60; // Cache for 60 seconds

async function getDashboardData() {
  try {
    // 1. Fetch products & current stock
    const { data: stockItems, error: stockErr } = await supabaseAdmin
      .from("v_current_stock")
      .select("*");

    let items = stockItems || [];

    // Fallback if view doesn't exist yet: query products directly
    if (stockErr || !items || items.length === 0) {
      const { data: prodData } = await supabaseAdmin.from("products").select("*");
      items = (prodData || []).map((p) => ({
        ...p,
        current_stock: 0,
        latest_date: new Date().toISOString().substring(0, 10),
      }));
    }

    // 2. Fetch last sync metadata
    const { data: syncMeta } = await supabaseAdmin
      .from("sync_metadata")
      .select("*")
      .order("last_synced_at", { ascending: false });

    const lastStockSync = syncMeta?.find((s) => s.sheet_name === "Stock Sheet");

    // 3. Compute Stats
    const totalSKUs = items.length;
    let totalStock = 0;
    let outOfStock = 0;
    let lowStock = 0;
    const catSet = new Set<string>();
    const sourcingSet = new Set<string>();

    items.forEach((item) => {
      const stock = item.current_stock || 0;
      totalStock += stock;
      if (stock === 0) outOfStock++;
      else if (item.required_qty > 0 && stock < item.required_qty) lowStock++;
      else if (item.required_qty === 0 && stock < 10) lowStock++;

      if (item.category) catSet.add(item.category);
      if (item.sourcing) sourcingSet.add(item.sourcing);
    });

    // 4. Fetch daily totals for overall warehouse trend
    const { data: dailyData } = await supabaseAdmin
      .from("daily_stock")
      .select("date, quantity");

    const dateAggMap = new Map<string, number>();
    (dailyData || []).forEach((row) => {
      const prev = dateAggMap.get(row.date) || 0;
      dateAggMap.set(row.date, prev + (row.quantity || 0));
    });

    const trendData = Array.from(dateAggMap.entries())
      .map(([date, quantity]) => ({ date, quantity }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      items,
      stats: {
        totalSKUs,
        totalStock,
        outOfStock,
        lowStock,
        categoriesCount: catSet.size,
        lastSyncedAt: lastStockSync?.last_synced_at || null,
      },
      categories: Array.from(catSet).sort(),
      sourcings: Array.from(sourcingSet).sort(),
      trendData,
    };
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    return {
      items: [],
      stats: {
        totalSKUs: 0,
        totalStock: 0,
        outOfStock: 0,
        lowStock: 0,
        categoriesCount: 0,
        lastSyncedAt: null,
      },
      categories: [],
      sourcings: [],
      trendData: [],
    };
  }
}

export default async function DashboardPage() {
  const { items, stats, categories, sourcings, trendData } = await getDashboardData();

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* KPI Stats Grid */}
      <StatsCards
        totalSKUs={stats.totalSKUs}
        totalStock={stats.totalStock}
        outOfStock={stats.outOfStock}
        lowStock={stats.lowStock}
        categoriesCount={stats.categoriesCount}
        lastSyncedAt={stats.lastSyncedAt}
      />

      {/* Warehouse Stock Trend Chart */}
      {trendData.length > 0 && (
        <StockChart
          data={trendData}
          title="Overall Warehouse Stock Volume Trend (All SKUs Combined)"
        />
      )}

      {/* Main Stock Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Inventory Catalog</h2>
            <p className="text-xs text-slate-500">
              Live inventory mirrored from Google Sheets. Instant search & multi-filter.
            </p>
          </div>
          <Link
            href="/inventory"
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span>View Full Inventory Table</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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
