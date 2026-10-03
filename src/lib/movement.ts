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
  trend: number[]; // Daily stock level history
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

export interface MovementFilterOptions {
  days?: number;
  startDate?: string;
  endDate?: string;
  date?: string; // single date
}

export function invalidateInventoryMovementCache() {
  try {
    revalidateTag("movement-data");
  } catch (e) {}
}

export async function getInventoryMovement(
  filter?: number | MovementFilterOptions
): Promise<MovementDataResponse> {
  const options: MovementFilterOptions =
    typeof filter === "number" ? { days: filter } : (filter || { days: 1 });

  let cacheKey = "1d";
  if (options.date) {
    cacheKey = `date-${options.date}`;
  } else if (options.startDate && options.endDate) {
    cacheKey = `range-${options.startDate}-${options.endDate}`;
  } else if (options.days) {
    cacheKey = `days-${options.days}`;
  }

  return unstable_cache(
    async () => computeInventoryMovement(options),
    [`movement-data-${cacheKey}`],
    {
      tags: ["movement-data", `movement-data-${cacheKey}`],
      revalidate: 300,
    }
  )();
}

// Helper: Fetch all transactions within a date range with automatic pagination
async function fetchTransactionsInRange(
  table: "inward_transactions" | "outward_transactions",
  startIso: string,
  endIso: string
): Promise<{ sku_code: string; quantity: number; date: string }[]> {
  const rows: { sku_code: string; quantity: number; date: string }[] = [];
  let offset = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("sku_code, quantity, date")
      .gte("date", startIso)
      .lte("date", endIso)
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error || !data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return rows;
}

async function computeInventoryMovement(options: MovementFilterOptions): Promise<MovementDataResponse> {
  // 1. Determine reporting date with T-1 delay or custom single date / range
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });
  const todayIST = formatter.format(new Date());
  const d = new Date(todayIST + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  const defaultYesterday = formatter.format(d);

  let startDate: string;
  let endDate: string;
  let numDays: number;

  if (options.date && /^\d{4}-\d{2}-\d{2}$/.test(options.date)) {
    startDate = options.date;
    endDate = options.date;
    numDays = 1;
  } else if (
    options.startDate &&
    options.endDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(options.startDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(options.endDate)
  ) {
    if (options.startDate <= options.endDate) {
      startDate = options.startDate;
      endDate = options.endDate;
    } else {
      startDate = options.endDate;
      endDate = options.startDate;
    }
    const diffMs =
      new Date(endDate + "T12:00:00Z").getTime() - new Date(startDate + "T12:00:00Z").getTime();
    numDays = Math.max(1, Math.round(diffMs / 86400000) + 1);
  } else {
    numDays = Math.min(90, Math.max(1, options.days || 1));
    const { data: latestStockRow } = await supabaseAdmin
      .from("daily_stock")
      .select("date")
      .lte("date", defaultYesterday)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    endDate = latestStockRow?.date || defaultYesterday;
    const startD = new Date(endDate + "T12:00:00Z");
    startD.setUTCDate(startD.getUTCDate() - (numDays - 1));
    startDate = formatter.format(startD);
  }

  const startIso = `${startDate}T00:00:00.000Z`;
  const endIso = `${endDate}T23:59:59.999Z`;

  // 2. Concurrently fetch Inward & Outward transactions, products catalog, and current stock view
  const [inwardTxs, outwardTxs, { data: products }, { data: stockView }] = await Promise.all([
    fetchTransactionsInRange("inward_transactions", startIso, endIso),
    fetchTransactionsInRange("outward_transactions", startIso, endIso),
    supabaseAdmin.from("products").select("sku_code, old_sku_code, product_name, brand, category, sourcing"),
    supabaseAdmin.from("v_current_stock").select("sku_code, current_stock"),
  ]);

  // 3. Build product and canonical SKU mappings
  const prodMap = new Map<string, any>();
  const oldToCanonical = new Map<string, string>();
  (products || []).forEach((p) => {
    if (p.sku_code) {
      prodMap.set(p.sku_code, p);
      if (p.old_sku_code) {
        oldToCanonical.set(p.old_sku_code, p.sku_code);
        prodMap.set(p.old_sku_code, p);
      }
    }
  });

  const currentStockMap = new Map<string, number>();
  (stockView || []).forEach((r) => {
    currentStockMap.set(r.sku_code, r.current_stock || 0);
  });

  // 4. Aggregate unique SKUs and their total quantities
  function aggregateTxs(
    txs: { sku_code: string; quantity: number; date: string }[],
    type: "inward" | "outward"
  ): { totalSkus: number; totalQty: number; items: MovementItem[] } {
    const skuQtyMap = new Map<string, number>();

    txs.forEach((tx) => {
      const canonicalSku = oldToCanonical.get(tx.sku_code) || tx.sku_code;
      const qty = tx.quantity || 0;
      skuQtyMap.set(canonicalSku, (skuQtyMap.get(canonicalSku) || 0) + qty);
    });

    const items: MovementItem[] = [];
    skuQtyMap.forEach((qty, skuCode) => {
      const prod = prodMap.get(skuCode);
      const curr = currentStockMap.get(skuCode) ?? 0;
      const prev = type === "outward" ? curr + qty : Math.max(0, curr - qty);

      items.push({
        sku: skuCode,
        name: prod?.product_name || skuCode,
        brand: prod?.brand || "GENERIC",
        category: prod?.category || "UNCATEGORIZED",
        sourcing: prod?.sourcing || "MARKET",
        change_qty: qty,
        current_stock: curr,
        prev_stock: prev,
        trend: [],
      });
    });

    // Sort descending by movement quantity
    items.sort((a, b) => b.change_qty - a.change_qty);
    const totalQty = items.reduce((acc, item) => acc + item.change_qty, 0);

    return {
      totalSkus: items.length,
      totalQty,
      items,
    };
  }

  const inwardResult = aggregateTxs(inwardTxs, "inward");
  const outwardResult = aggregateTxs(outwardTxs, "outward");

  // 5. Fetch 14-day stock trend for moving SKUs
  const allMovingSkus = Array.from(
    new Set([
      ...inwardResult.items.map((i) => i.sku),
      ...outwardResult.items.map((i) => i.sku),
    ])
  );

  if (allMovingSkus.length > 0) {
    const trendDays = Math.max(14, numDays);
    const trendStartD = new Date(endDate + "T12:00:00Z");
    trendStartD.setUTCDate(trendStartD.getUTCDate() - trendDays);
    const trendStartDate = formatter.format(trendStartD);

    const skuTrendMap = new Map<string, number[]>();
    const batches: string[][] = [];
    for (let i = 0; i < allMovingSkus.length; i += 50) {
      batches.push(allMovingSkus.slice(i, i + 50));
    }

    const trendResults = await Promise.all(
      batches.map((batch) =>
        supabaseAdmin
          .from("daily_stock")
          .select("sku_code, date, quantity")
          .in("sku_code", batch)
          .gte("date", trendStartDate)
          .lte("date", endDate)
          .order("date", { ascending: true })
      )
    );

    trendResults.forEach(({ data: rows }) => {
      (rows || []).forEach((r) => {
        if (!skuTrendMap.has(r.sku_code)) skuTrendMap.set(r.sku_code, []);
        skuTrendMap.get(r.sku_code)!.push(r.quantity || 0);
      });
    });

    // Assign trend to items
    const enrichTrend = (items: MovementItem[]) => {
      items.forEach((item) => {
        const raw = skuTrendMap.get(item.sku) || [];
        if (raw.length >= 2) {
          item.trend = raw;
        } else if (raw.length === 1) {
          item.trend = [item.prev_stock, raw[0]];
        } else {
          item.trend = [item.prev_stock, item.current_stock];
        }
      });
    };

    enrichTrend(inwardResult.items);
    enrichTrend(outwardResult.items);
  }

  return {
    latestDate: endDate,
    prevDate: startDate,
    days: numDays,
    delayDays: 1, // T-1 reporting delay note
    outward: outwardResult,
    inward: inwardResult,
  };
}
