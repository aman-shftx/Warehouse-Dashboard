import { supabaseAdmin } from "@/lib/supabase/server";

export interface MovementItem {
  category: string;
  brand: string;
  name: string;
  sku: string;
  change_qty: number; // dispatched_qty (>0) or inward_qty (>0)
  current_stock: number;
  prev_stock: number;
  sourcing: string;
}

export interface MovementSectionData {
  totalSkus: number;
  totalQty: number;
  items: MovementItem[];
}

export interface MovementDataResponse {
  latestDate: string | null;
  prevDate: string | null;
  days: number;
  delayDays: number;
  outward: MovementSectionData;
  inward: MovementSectionData;
}

export async function getInventoryMovement(days: number = 1): Promise<MovementDataResponse> {
  const numDays = Math.max(1, days);

  // 1. Get the latest available recorded date
  const { data: latestRow, error: latestErr } = await supabaseAdmin
    .from("daily_stock")
    .select("date")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestErr || !latestRow?.date) {
    return {
      latestDate: null,
      prevDate: null,
      days: numDays,
      delayDays: 1,
      outward: { totalSkus: 0, totalQty: 0, items: [] },
      inward: { totalSkus: 0, totalQty: 0, items: [] },
    };
  }

  const latestDate = latestRow.date;

  // 2. Find closest date <= (latestDate - numDays)
  const targetDateObj = new Date(latestDate);
  targetDateObj.setDate(targetDateObj.getDate() - numDays);
  const targetDateStr = targetDateObj.toISOString().split("T")[0];

  const { data: prevRow } = await supabaseAdmin
    .from("daily_stock")
    .select("date")
    .lte("date", targetDateStr)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const prevDate = prevRow?.date || targetDateStr;

  // 3. Fetch stock records for both dates and all product info
  const [{ data: stockLatest }, { data: stockPrev }, { data: products }] = await Promise.all([
    supabaseAdmin.from("daily_stock").select("sku_code, quantity").eq("date", latestDate),
    supabaseAdmin.from("daily_stock").select("sku_code, quantity").eq("date", prevDate),
    supabaseAdmin.from("products").select("sku_code, old_sku_code, product_name, brand, category, sourcing"),
  ]);

  // 4. Map products
  const prodMap = new Map<string, any>();
  (products || []).forEach((p) => {
    if (p.sku_code) prodMap.set(p.sku_code, p);
    if (p.old_sku_code) prodMap.set(p.old_sku_code, p);
  });

  const prevMap = new Map<string, number>();
  (stockPrev || []).forEach((r) => prevMap.set(r.sku_code, r.quantity || 0));

  const latestMap = new Map<string, number>();
  (stockLatest || []).forEach((r) => latestMap.set(r.sku_code, r.quantity || 0));

  const allSkus = new Set([...prevMap.keys(), ...latestMap.keys()]);

  const outwardItems: MovementItem[] = [];
  const inwardItems: MovementItem[] = [];

  allSkus.forEach((sku) => {
    const prevQty = prevMap.get(sku) ?? 0;
    const currQty = latestMap.get(sku) ?? 0;
    const diff = currQty - prevQty;
    const prod = prodMap.get(sku);

    const category = prod?.category || "UNCATEGORIZED";
    const brand = prod?.brand || "GENERIC";
    const name = prod?.product_name || sku;
    const skuCode = prod?.sku_code || sku;
    const sourcing = prod?.sourcing || "MARKET";

    if (diff < 0) {
      // Outward: quantity decreased from last date to today
      // Dispatched Qty = last date qty - today's date qty
      outwardItems.push({
        category,
        brand,
        name,
        sku: skuCode,
        change_qty: prevQty - currQty,
        current_stock: currQty,
        prev_stock: prevQty,
        sourcing,
      });
    } else if (diff > 0) {
      // Inward: quantity increased
      // Inward Qty = today's date qty - last date qty
      inwardItems.push({
        category,
        brand,
        name,
        sku: skuCode,
        change_qty: currQty - prevQty,
        current_stock: currQty,
        prev_stock: prevQty,
        sourcing,
      });
    }
  });

  // Sort descending by movement quantity
  outwardItems.sort((a, b) => b.change_qty - a.change_qty);
  inwardItems.sort((a, b) => b.change_qty - a.change_qty);

  const totalOutwardQty = outwardItems.reduce((acc, item) => acc + item.change_qty, 0);
  const totalInwardQty = inwardItems.reduce((acc, item) => acc + item.change_qty, 0);

  return {
    latestDate,
    prevDate,
    days: numDays,
    delayDays: 1, // T-1 reporting delay note
    outward: {
      totalSkus: outwardItems.length,
      totalQty: totalOutwardQty,
      items: outwardItems,
    },
    inward: {
      totalSkus: inwardItems.length,
      totalQty: totalInwardQty,
      items: inwardItems,
    },
  };
}
