import { supabaseAdmin } from "@/lib/supabase/server";
import { StockTable } from "@/components/dashboard/StockTable";

export const revalidate = 60;

export default async function InventoryPage() {
  const { data: stockItems } = await supabaseAdmin
    .from("v_current_stock")
    .select("*");

  let items = stockItems || [];
  if (!items || items.length === 0) {
    const { data: prodData } = await supabaseAdmin.from("products").select("*");
    items = (prodData || []).map((p) => ({
      ...p,
      current_stock: 0,
      latest_date: new Date().toISOString().substring(0, 10),
    }));
  }

  const catSet = new Set<string>();
  const sourcingSet = new Set<string>();
  items.forEach((item) => {
    if (item.category) catSet.add(item.category);
    if (item.sourcing) sourcingSet.add(item.sourcing);
  });

  return (
    <div className="space-y-4 max-w-[1500px] mx-auto">
      <div>
        <h1 className="text-base font-bold text-slate-900 tracking-tight">Full Warehouse Inventory</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Complete read-only catalog with SKU lookup, category filtering, and stock counts.
        </p>
      </div>

      <StockTable
        items={items}
        categories={Array.from(catSet).sort()}
        sourcings={Array.from(sourcingSet).sort()}
      />
    </div>
  );
}
