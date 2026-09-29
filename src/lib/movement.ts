import { supabaseAdmin } from "@/lib/supabase/server";
import { unstable_cache, revalidateTag } from "next/cache";

export interface MovementItem {
  category: string;
  brand: string;
  name: string;
  sku: string;
  change_qty: number; // dispatched_qty (>0) or inward_qty (>0)
  current_stock: number;
  prev_stock: number;
  sourcing: string;
  trend: number[]; // Daily stock level history from prevDate to latestDate
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

export function invalidateInventoryMovementCache() {
  try {
    revalidateTag("movement-data");
  } catch (e) {}
}

const getCachedInventoryMovement = (days: number) =>
  unstable_cache(
    async () => computeInventoryMovement(days),
    [`movement-data-${days}`],
    {
      tags: ["movement-data", `movement-data-${days}`],
      revalidate: 3600,
    }
  )();

export async function getInventoryMovement(days: number = 1): Promise<MovementDataResponse> {
  const numDays = Math.min(90, Math.max(1, days));
  return getCachedInventoryMovement(numDays);
}

async function computeInventoryMovement(days: number): Promise<MovementDataResponse> {
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

  const allSkus = new Set([...Array.from(prevMap.keys()), ...Array.from(latestMap.keys())]);

  // 5. Fetch daily trend for moving SKUs (last 14 days by default)
  const movingSkus = Array.from(allSkus).filter((sku) => {
    const p = prevMap.get(sku) ?? 0;
    const c = latestMap.get(sku) ?? 0;
    return p !== c;
  });

  const skuTrendMap = new Map<string, number[]>();
  if (movingSkus.length > 0) {
    const trendDays = Math.max(14, numDays);
    const trendStartObj = new Date(latestDate);
    trendStartObj.setDate(trendStartObj.getDate() - trendDays);
    const trendStartDate = trendStartObj.toISOString().split("T")[0];

    const batches = [];
    for (let i = 0; i < movingSkus.length; i += 50) {
      batches.push(movingSkus.slice(i, i + 50));
    }
    const results = await Promise.all(
      batches.map((batch) =>
        supabaseAdmin
          .from("daily_stock")
          .select("sku_code, date, quantity")
          .in("sku_code", batch)
          .gte("date", trendStartDate)
          .lte("date", latestDate)
          .order("date", { ascending: true })
      )
    );
    results.forEach(({ data: rows }) => {
      (rows || []).forEach((r) => {
        if (!skuTrendMap.has(r.sku_code)) skuTrendMap.set(r.sku_code, []);
        skuTrendMap.get(r.sku_code)!.push(r.quantity || 0);
      });
    });
  }

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
    const rawTrend = skuTrendMap.get(skuCode) || skuTrendMap.get(sku) || [];
    let trend: number[];
    if (rawTrend.length >= 2) {
      trend = rawTrend;
    } else if (rawTrend.length === 1) {
      trend = [prevQty, rawTrend[0]];
    } else {
      trend = [prevQty, currQty];
    }

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
        trend,
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
        trend,
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
