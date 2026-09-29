import { EnrichedSKUItem, POIssuedRecord } from "@/types";

export interface AlertsMetrics {
  outOfStockList: EnrichedSKUItem[];
  criticallyRequiredList: EnrichedSKUItem[];
  reorderRequiredList: EnrichedSKUItem[];
  ignoredList: EnrichedSKUItem[];
  poIssuedList: EnrichedSKUItem[];
  deadStockList: EnrichedSKUItem[];
  totalReorderDeficitUnits: number;
  oosCount: number;
  criticalCount: number;
  reorderCount: number;
  deadStockCount: number;
  ignoredCount: number;
  poIssuedCount: number;
}

/**
 * Net replenishment target quantity needed to reach 30 days of cover.
 * Target Qty = max(0, (DRR_30D * 30) - In-Stock Qty)
 */
export function getTargetQty(item: { drr_30d?: number; current_stock?: number }): number {
  const required30D = Math.round((item.drr_30d || 0) * 30);
  return Math.max(0, required30D - (item.current_stock || 0));
}

/**
 * Days of inventory cover based on 30-Day Daily Run Rate.
 */
export function getCoverDays30D(item: { drr_30d?: number; current_stock?: number }): number {
  if (!item.current_stock || item.current_stock <= 0) return 0;
  if (item.drr_30d && item.drr_30d > 0) {
    return parseFloat((item.current_stock / item.drr_30d).toFixed(1));
  }
  return 999;
}

/**
 * Single source of truth calculation for Alerts & Reorders.
 * Used identically across Alerts tab, Home page cards, and Inventory Health Distribution.
 */
export function calculateAlertsMetrics(
  items: EnrichedSKUItem[],
  ignoredSKUs: Set<string> | string[] = new Set(),
  poIssuedRecords: Record<string, POIssuedRecord> = {}
): AlertsMetrics {
  const ignoredSet = ignoredSKUs instanceof Set ? ignoredSKUs : new Set(ignoredSKUs || []);
  const poMap = poIssuedRecords || {};

  const outOfStockList: EnrichedSKUItem[] = [];
  const criticallyRequiredList: EnrichedSKUItem[] = [];
  const reorderRequiredList: EnrichedSKUItem[] = [];
  const ignoredList: EnrichedSKUItem[] = [];
  const poIssuedList: EnrichedSKUItem[] = [];
  const deadStockList: EnrichedSKUItem[] = [];
  let totalReorderDeficitUnits = 0;

  for (const item of items) {
    const isIgnored = ignoredSet.has(item.sku_code);
    const hasPO = Boolean(poMap[item.sku_code]);

    if (isIgnored) {
      ignoredList.push(item);
      continue;
    }

    if (hasPO) {
      poIssuedList.push(item);
      continue;
    }

    const cover = getCoverDays30D(item);
    const target = getTargetQty(item);

    if (item.current_stock <= 0) {
      outOfStockList.push(item);
    } else {
      if (cover < 15) {
        criticallyRequiredList.push(item);
      }
      if (cover < 30) {
        reorderRequiredList.push(item);
        totalReorderDeficitUnits += target;
      }
      if (!item.drr_30d || item.drr_30d === 0) {
        deadStockList.push(item);
      }
    }
  }

  return {
    outOfStockList,
    criticallyRequiredList,
    reorderRequiredList,
    ignoredList,
    poIssuedList,
    deadStockList,
    totalReorderDeficitUnits,
    oosCount: outOfStockList.length,
    criticalCount: criticallyRequiredList.length,
    reorderCount: reorderRequiredList.length,
    deadStockCount: deadStockList.length,
    ignoredCount: ignoredList.length,
    poIssuedCount: poIssuedList.length
  };
}
