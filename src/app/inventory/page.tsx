import { Suspense } from "react";
import { getWarehouseIntelligence } from "@/lib/analytics";
import { InventoryClientDashboard } from "@/components/dashboard/InventoryClientDashboard";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";

export const revalidate = 60; // Cache for 60 seconds

async function InventoryDataStreamer() {
  const intel = await getWarehouseIntelligence();

  const catSet = new Set<string>();
  const sourcingSet = new Set<string>();
  intel.items.forEach((item) => {
    if (item.category) catSet.add(item.category);
    if (item.sourcing) sourcingSet.add(item.sourcing);
  });

  const tableItems = intel.items.map((i) => ({
    sku_code: i.sku_code,
    old_sku_code: i.old_sku_code,
    product_name: i.name,
    brand: i.brand,
    category: i.category,
    sourcing: i.sourcing,
    current_stock: i.current_stock,
    required_qty: i.required_qty,
    drr_7d: i.drr_7d,
    drr_14d: i.drr_14d,
    days_of_stock: i.days_of_stock,
    latest_date: intel.stats.latestStockDate || undefined,
  }));

  const stats = {
    totalSKUs: intel.stats.totalSKUs,
    totalStock: intel.stats.totalWarehouseStock,
    outOfStock: intel.stats.oosCount,
    lowStock: intel.stats.lowStockCount,
    categoriesCount: catSet.size,
    lastSyncedAt: intel.stats.lastSyncedAt,
  };

  return (
    <InventoryClientDashboard
      items={tableItems}
      stats={stats}
      categories={Array.from(catSet).sort()}
      sourcings={Array.from(sourcingSet).sort()}
      initialTrendData={intel.macroTrend}
      rawItems={intel.items}
      initialAlertsState={intel.alertsState}
    />
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<TableSkeleton title="Loading Inventory Catalog..." />}>
      <InventoryDataStreamer />
    </Suspense>
  );
}
