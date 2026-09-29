import { supabaseAdmin } from "@/lib/supabase/server";
import {
  EnrichedSKUItem,
  ExecutiveOverviewData,
  ExecutiveSummaryStats,
  SourcingBreakdownItem,
  CategoryBreakdownItem,
  MacroStockPoint,
  DemandTrend,
  StockRiskStatus,
  ABCTier,
  SourcingActionPriority,
  AlertsState
} from "@/types";
import { calculateAlertsMetrics } from "@/lib/alerts-engine";

let cachedData: { data: ExecutiveOverviewData; expiresAt: number } | null = null;
let inFlightPromise: Promise<ExecutiveOverviewData> | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

export function invalidateWarehouseIntelligenceCache() {
  cachedData = null;
}

export async function getWarehouseIntelligence(): Promise<ExecutiveOverviewData> {
  const now = Date.now();
  if (cachedData && cachedData.expiresAt > now) {
    return cachedData.data;
  }

  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    try {
      const data = await computeWarehouseIntelligence();
      cachedData = {
        data,
        expiresAt: Date.now() + CACHE_TTL_MS,
      };
      return data;
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}

async function computeWarehouseIntelligence(): Promise<ExecutiveOverviewData> {
  // 1. Fetch metadata and latest operational dates concurrently
  const [
    { data: dsLatest },
    { data: otLatest },
    { data: inLatest },
    { data: products },
    { data: currentStockRows },
    { data: syncMeta }
  ] = await Promise.all([
    supabaseAdmin.from("daily_stock").select("date").order("date", { ascending: false }).limit(1),
    supabaseAdmin.from("outward_transactions").select("date").order("date", { ascending: false }).limit(1),
    supabaseAdmin.from("inward_transactions").select("date").order("date", { ascending: false }).limit(1),
    supabaseAdmin.from("products").select("*"),
    supabaseAdmin.from("v_current_stock").select("*"),
    supabaseAdmin.from("sync_metadata").select("*")
  ]);

  const latestStockDate = dsLatest?.[0]?.date || null;
  const latestOutwardDate = otLatest?.[0]?.date || null;
  const latestInwardDate = inLatest?.[0]?.date || null;

  // 2. Define 30-day calendar date array ending on Today (new Date())
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const past30Days: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    past30Days.push(dStr);
  }

  // 30 days window boundaries: from earliest day at 00:00:00Z to end of today at 23:59:59.999Z
  const d30Start = `${past30Days[29]}T00:00:00.000Z`;
  const todayEnd = `${todayStr}T23:59:59.999Z`;

  // 3. Paginated fetch of outward transactions in 30D window
  const allOutward30d: { sku_code: string; date: string; quantity: number }[] = [];
  let offset = 0;
  while (true) {
    const { data: page } = await supabaseAdmin
      .from("outward_transactions")
      .select("sku_code, date, quantity")
      .gte("date", d30Start)
      .lte("date", todayEnd)
      .order("id", { ascending: true })
      .range(offset, offset + 999);

    if (!page || page.length === 0) break;
    allOutward30d.push(...page);
    if (page.length < 1000) break;
    offset += 1000;
  }

  // 4. Map old_sku_code to canonical sku_code
  const prodOldMap = new Map<string, string>();
  (products || []).forEach((p) => {
    if (p.old_sku_code) prodOldMap.set(p.old_sku_code, p.sku_code);
  });

  // 5. Aggregate outward quantities per canonical SKU for 30 daily buckets
  const dateToDayIndex = new Map<string, number>();
  past30Days.forEach((dStr, idx) => dateToDayIndex.set(dStr, idx));

  const skuDailyOutwardMap = new Map<string, number[]>();
  const lastOutwardDateMap = new Map<string, string>();

  allOutward30d.forEach((r) => {
    const canonical = prodOldMap.get(r.sku_code) || r.sku_code;
    const qty = r.quantity || 0;

    const dayStr = r.date.substring(0, 10);
    const dayIdx = dateToDayIndex.get(dayStr);
    if (dayIdx !== undefined && dayIdx >= 0 && dayIdx < 30) {
      let arr = skuDailyOutwardMap.get(canonical);
      if (!arr) {
        arr = new Array(30).fill(0);
        skuDailyOutwardMap.set(canonical, arr);
      }
      arr[dayIdx] += qty;
    }

    const prevDate = lastOutwardDateMap.get(canonical);
    if (!prevDate || r.date > prevDate) {
      lastOutwardDateMap.set(canonical, r.date);
    }
  });

  // 6. Calculate yesterday's outward & inward velocity metrics
  const yesterdayStr = past30Days[1];
  let outwardYesterdaySkus = 0;
  let outwardYesterdayQty = 0;

  let targetOutwardDay = yesterdayStr;
  let dayOutward = allOutward30d.filter((r) => r.date.startsWith(targetOutwardDay));
  if (dayOutward.length === 0 && latestOutwardDate) {
    targetOutwardDay = latestOutwardDate.substring(0, 10);
    dayOutward = allOutward30d.filter((r) => r.date.startsWith(targetOutwardDay));
  }

  const daySkuSet = new Set<string>();
  dayOutward.forEach((r) => {
    daySkuSet.add(prodOldMap.get(r.sku_code) || r.sku_code);
    outwardYesterdayQty += r.quantity || 0;
  });
  outwardYesterdaySkus = daySkuSet.size;

  // Latest day inward receipts
  const latestInwardDayStr = latestInwardDate ? latestInwardDate.substring(0, 10) : null;
  let inwardYesterdaySkus = 0;
  let inwardYesterdayQty = 0;

  if (latestInwardDayStr) {
    const { data: dayInward } = await supabaseAdmin
      .from("inward_transactions")
      .select("sku_code, quantity")
      .gte("date", `${latestInwardDayStr}T00:00:00.000Z`)
      .lte("date", `${latestInwardDayStr}T23:59:59.999Z`);

    const inSkuSet = new Set<string>();
    (dayInward || []).forEach((r) => {
      inSkuSet.add(prodOldMap.get(r.sku_code) || r.sku_code);
      inwardYesterdayQty += r.quantity || 0;
    });
    inwardYesterdaySkus = inSkuSet.size;
  }

  // 7. Calculate ABC Classification
  const getSkuOutward = (sku: string, days: number) => {
    const arr = skuDailyOutwardMap.get(sku);
    if (!arr) return 0;
    return arr.slice(0, days).reduce((a, b) => a + b, 0);
  };

  const sortedByOutward = (currentStockRows || [])
    .map((item) => ({
      sku: item.sku_code,
      outward30: getSkuOutward(item.sku_code, 30),
    }))
    .sort((a, b) => b.outward30 - a.outward30);

  const total30dVolume = sortedByOutward.reduce((sum, i) => sum + i.outward30, 0);
  const abcMap = new Map<string, ABCTier>();
  let runningVolume = 0;

  sortedByOutward.forEach((item) => {
    runningVolume += item.outward30;
    const share = total30dVolume > 0 ? runningVolume / total30dVolume : 1;
    if (share <= 0.8) {
      abcMap.set(item.sku, "A");
    } else if (share <= 0.95) {
      abcMap.set(item.sku, "B");
    } else {
      abcMap.set(item.sku, "C");
    }
  });

  // 8. Enrich each SKU item with full metrics
  let totalWarehouseStock = 0;
  let oosCount = 0;
  let criticalCount = 0;
  let lowStockCount = 0;
  let healthyCount = 0;
  let excessCount = 0;
  let deadStockCount = 0;
  let reorderCount = 0;
  let totalDeficitUnits = 0;
  let totalDaysStockAcc = 0;
  let countWithDRR = 0;

  const enrichedItems: EnrichedSKUItem[] = (currentStockRows || []).map((item) => {
    const currentStock = item.current_stock || 0;
    const requiredQty = item.required_qty || 0;
    const trend = skuDailyOutwardMap.get(item.sku_code) || new Array(30).fill(0);
    const out7 = trend.slice(0, 7).reduce((a, b) => a + b, 0);
    const out14 = trend.slice(0, 14).reduce((a, b) => a + b, 0);
    const out30 = trend.slice(0, 30).reduce((a, b) => a + b, 0);

    const drr7d = parseFloat((out7 / 7.0).toFixed(2));
    const drr14d = parseFloat((out14 / 14.0).toFixed(2));
    const drr30d = parseFloat((out30 / 30.0).toFixed(2));

    // Stock cover / Days of Stock (Calculated based on 14 days warehouse DRR as requested)
    let daysOfStock = 999;
    if (drr14d > 0) {
      daysOfStock = parseFloat((currentStock / drr14d).toFixed(1));
      totalDaysStockAcc += daysOfStock;
      countWithDRR++;
    } else if (drr7d > 0) {
      daysOfStock = parseFloat((currentStock / drr7d).toFixed(1));
      totalDaysStockAcc += daysOfStock;
      countWithDRR++;
    } else if (drr30d > 0) {
      daysOfStock = parseFloat((currentStock / drr30d).toFixed(1));
      totalDaysStockAcc += daysOfStock;
      countWithDRR++;
    }

    const projectedStockoutDays = daysOfStock >= 999 ? -1 : Math.round(daysOfStock);

    // Demand Acceleration
    let accelPct = 0;
    let demandTrend: DemandTrend = "STABLE";
    if (drr30d > 0) {
      accelPct = parseFloat((((drr7d - drr30d) / drr30d) * 100).toFixed(1));
      if (drr7d > drr30d * 1.15) demandTrend = "ACCELERATING";
      else if (drr7d < drr30d * 0.85) demandTrend = "DECLINING";
    } else if (drr7d > 0) {
      accelPct = 100;
      demandTrend = "ACCELERATING";
    }

    // Risk Status Classification
    let riskStatus: StockRiskStatus = "HEALTHY";
    if (currentStock === 0) {
      riskStatus = "OUT_OF_STOCK";
      oosCount++;
    } else if (daysOfStock < 7) {
      riskStatus = "CRITICAL";
      criticalCount++;
    } else if (requiredQty > 0 && currentStock < requiredQty) {
      riskStatus = "LOW_COVER";
      lowStockCount++;
    } else if (currentStock > 0 && out30 === 0) {
      riskStatus = "DEAD_STOCK";
      deadStockCount++;
    } else if (daysOfStock > 60 || (requiredQty > 0 && currentStock > requiredQty * 2.5)) {
      riskStatus = "EXCESS";
      excessCount++;
    } else {
      healthyCount++;
    }

    // Reorder Analysis
    const isReorder = requiredQty > 0 && currentStock < requiredQty;
    const deficit = Math.max(0, requiredQty - currentStock);
    if (isReorder) {
      reorderCount++;
      totalDeficitUnits += deficit;
    }

    totalWarehouseStock += currentStock;

    // Action Priority & Suggested Action
    let actionPriority: SourcingActionPriority = "NORMAL";
    let suggestedAction = "Maintain standard monitor";

    if (currentStock === 0) {
      actionPriority = "CRITICAL";
      suggestedAction = requiredQty > 0 ? `URGENT PO: Order ${requiredQty} units` : "CRITICAL: Stockout, review sourcing";
    } else if (daysOfStock < 7 && drr14d >= 5) {
      actionPriority = "CRITICAL";
      suggestedAction = `IMMINENT STOCKOUT: Only ${daysOfStock}d left, expedited reorder`;
    } else if (isReorder) {
      actionPriority = "ATTENTION";
      suggestedAction = `REORDER NEEDED: Deficit of ${deficit} units to target`;
    } else if (riskStatus === "EXCESS" || riskStatus === "DEAD_STOCK") {
      actionPriority = "EXCESS";
      suggestedAction = riskStatus === "DEAD_STOCK" ? "DEAD STOCK: No demand in 30d, liquidate" : "OVERSTOCKED: Pause procurement";
    }

    const abcTier = abcMap.get(item.sku_code) || "C";

    return {
      sku_code: item.sku_code,
      old_sku_code: item.old_sku_code,
      name: item.product_name || item.sku_code,
      category: item.category || "UNCATEGORIZED",
      brand: item.brand || "GENERIC",
      sourcing: item.sourcing || "MARKET",
      current_stock: currentStock,
      required_qty: requiredQty,
      deficit,
      is_reorder: isReorder,
      outward_7d: out7,
      drr_7d: drr7d,
      outward_14d: out14,
      drr_14d: drr14d,
      outward_30d: out30,
      drr_30d: drr30d,
      days_of_stock: daysOfStock,
      projected_stockout_days: projectedStockoutDays,
      accel_pct: accelPct,
      demand_trend: demandTrend,
      risk_status: riskStatus,
      abc_tier: abcTier,
      action_priority: actionPriority,
      suggested_action: suggestedAction,
      last_outward_date: lastOutwardDateMap.get(item.sku_code) || null,
      trend: skuDailyOutwardMap.get(item.sku_code) || new Array(30).fill(0),
    };
  });

  const avgDaysOfStock = countWithDRR > 0 ? parseFloat((totalDaysStockAcc / countWithDRR).toFixed(1)) : 0;

  // 9. Sourcing Breakdown
  const sourcingMap = new Map<string, SourcingBreakdownItem>();
  enrichedItems.forEach((item) => {
    const src = item.sourcing;
    const cur = sourcingMap.get(src) || {
      sourcing: src,
      skuCount: 0,
      totalStock: 0,
      outward7d: 0,
      outward14d: 0,
      avgDrr: 0,
      avgDrr14d: 0,
      oosCount: 0,
      reorderCount: 0,
    };

    cur.skuCount++;
    cur.totalStock += item.current_stock;
    cur.outward7d += item.outward_7d;
    cur.outward14d = (cur.outward14d || 0) + item.outward_14d;
    if (item.current_stock === 0) cur.oosCount++;
    if (item.is_reorder) cur.reorderCount++;
    sourcingMap.set(src, cur);
  });

  const sourcingBreakdown: SourcingBreakdownItem[] = Array.from(sourcingMap.values())
    .map((s) => ({
      ...s,
      avgDrr: parseFloat((s.outward7d / 7.0).toFixed(1)),
      avgDrr14d: parseFloat(((s.outward14d || 0) / 14.0).toFixed(1)),
    }))
    .sort((a, b) => b.totalStock - a.totalStock);

  // 10. Category Breakdown
  const catMap = new Map<string, CategoryBreakdownItem>();
  enrichedItems.forEach((item) => {
    const cat = item.category;
    const cur = catMap.get(cat) || {
      category: cat,
      skuCount: 0,
      totalStock: 0,
      outward7d: 0,
      outward14d: 0,
      avgDrr: 0,
      avgDrr14d: 0,
      oosCount: 0,
      reorderCount: 0,
    };

    cur.skuCount++;
    cur.totalStock += item.current_stock;
    cur.outward7d += item.outward_7d;
    cur.outward14d = (cur.outward14d || 0) + item.outward_14d;
    if (item.current_stock === 0) cur.oosCount++;
    if (item.is_reorder) cur.reorderCount++;
    catMap.set(cat, cur);
  });

  const categoryBreakdown: CategoryBreakdownItem[] = Array.from(catMap.values())
    .map((c) => ({
      ...c,
      avgDrr: parseFloat((c.outward7d / 7.0).toFixed(1)),
      avgDrr14d: parseFloat(((c.outward14d || 0) / 14.0).toFixed(1)),
    }))
    .sort((a, b) => b.totalStock - a.totalStock);

  // 11. 30-Day Macro Inventory Trend (Warehouse closing balance trajectory)
  const d30StartStr = latestStockDate
    ? new Date(new Date(latestStockDate).setDate(new Date(latestStockDate).getDate() - 30)).toISOString().substring(0, 10)
    : "2026-08-28";

  const dateSumMap = new Map<string, number>();
  let stockOffset = 0;
  while (true) {
    const { data: page } = await supabaseAdmin
      .from("daily_stock")
      .select("date, quantity")
      .gte("date", d30StartStr)
      .order("id", { ascending: true })
      .range(stockOffset, stockOffset + 999);

    if (!page || page.length === 0) break;
    for (const row of page) {
      dateSumMap.set(row.date, (dateSumMap.get(row.date) || 0) + (row.quantity || 0));
    }
    if (page.length < 1000) break;
    stockOffset += 1000;
  }

  const macroTrend: MacroStockPoint[] = Array.from(dateSumMap.entries())
    .map(([date, quantity]) => ({ date, quantity }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 12. Sourcing Action Queue: Highest priority action items
  const priorityOrder: Record<SourcingActionPriority, number> = {
    CRITICAL: 1,
    ATTENTION: 2,
    EXCESS: 3,
    NORMAL: 4,
  };

  const sourcingActionQueue = enrichedItems
    .filter((i) => i.action_priority !== "NORMAL")
    .sort((a, b) => {
      const pDiff = priorityOrder[a.action_priority] - priorityOrder[b.action_priority];
      if (pDiff !== 0) return pDiff;
      if (a.action_priority === "CRITICAL" || a.action_priority === "ATTENTION") {
        return b.deficit - a.deficit;
      }
      return b.current_stock - a.current_stock;
    })
    .slice(0, 20);

  const lastStockSync = (syncMeta || []).find((s) => s.sheet_name === "Stock Sheet");

  // Single Source of Truth for Alert & Reorder metrics
  const alertsRow = (syncMeta || []).find((s) => s.sheet_name === "alerts_actions");
  let alertsState: AlertsState = { ignored: [], poIssued: {} };
  if (alertsRow?.error_message) {
    try {
      const parsed = JSON.parse(alertsRow.error_message);
      alertsState = {
        ignored: Array.isArray(parsed.ignored) ? parsed.ignored : [],
        poIssued: typeof parsed.poIssued === "object" && parsed.poIssued !== null ? parsed.poIssued : {}
      };
    } catch (e) {}
  }

  const alertsMetrics = calculateAlertsMetrics(
    enrichedItems,
    alertsState.ignored,
    alertsState.poIssued
  );

  const stats: ExecutiveSummaryStats = {
    totalSKUs: enrichedItems.length,
    totalWarehouseStock,
    oosCount: alertsMetrics.oosCount,
    criticalCount: alertsMetrics.criticalCount,
    lowStockCount: alertsMetrics.reorderCount,
    healthyCount,
    excessCount,
    deadStockCount: alertsMetrics.deadStockCount,
    reorderCount: alertsMetrics.reorderCount,
    totalDeficitUnits: alertsMetrics.totalReorderDeficitUnits,
    avgDaysOfStock,
    latestStockDate,
    latestOutwardDate,
    outwardYesterdaySkus,
    outwardYesterdayQty,
    inwardYesterdaySkus,
    inwardYesterdayQty,
    netMovementYesterday: inwardYesterdayQty - outwardYesterdayQty,
    lastSyncedAt: lastStockSync?.last_synced_at || null,
  };

  return {
    stats,
    items: enrichedItems,
    sourcingBreakdown,
    categoryBreakdown,
    macroTrend,
    sourcingActionQueue,
    alertsState,
  };
}
