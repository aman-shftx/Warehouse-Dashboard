import { supabaseAdmin } from "@/lib/supabase/server";
import { InventoryClientDashboard } from "@/components/dashboard/InventoryClientDashboard";

export const revalidate = 60; // Cache for 60 seconds

async function getInventoryData() {
  try {
    // 1. Fetch products & current stock
    const { data: stockItems, error: stockErr } = await supabaseAdmin
      .from("v_current_stock")
      .select("*");

    let items = stockItems || [];

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

      if (item.category) catSet.add(item.category);
      if (item.sourcing) sourcingSet.add(item.sourcing);
    });

    // 4. Fetch daily totals across all records for warehouse trend
    const dateAggMap = new Map<string, number>();
    let offset = 0;
    while (true) {
      const { data: page } = await supabaseAdmin
        .from("daily_stock")
        .select("date, quantity")
        .range(offset, offset + 999);
      if (!page || page.length === 0) break;
      for (const row of page) {
        dateAggMap.set(row.date, (dateAggMap.get(row.date) || 0) + (row.quantity || 0));
      }
      if (page.length < 1000) break;
      offset += 1000;
    }

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
    console.error("Error fetching inventory data:", err);
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

export default async function InventoryPage() {
  const { items, stats, categories, sourcings, trendData } = await getInventoryData();

  return (
    <InventoryClientDashboard
      items={items}
      stats={stats}
      categories={categories}
      sourcings={sourcings}
      initialTrendData={trendData}
    />
  );
}
