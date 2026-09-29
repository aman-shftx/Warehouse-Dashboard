export interface Product {
  id?: number;
  sku_code: string;
  old_sku_code?: string | null;
  product_name: string | null;
  brand: string | null;
  category: string | null;
  sourcing: string | null;
  required_qty: number;
  created_at?: string;
  updated_at?: string;
}

export interface CurrentStockItem extends Product {
  latest_date: string;
  current_stock: number;
}

export interface DailyStock {
  id?: number;
  sku_code: string;
  date: string;
  quantity: number;
}

export interface InwardTransaction {
  id?: number;
  sku_code: string;
  date: string;
  quantity: number;
  remark: string | null;
  reference_no: string | null;
  sheet_row_number?: number | null;
}

export interface OutwardTransaction {
  id?: number;
  sku_code: string;
  date: string;
  quantity: number;
  gatepass_no: string | null;
  sheet_row_number?: number | null;
}

export interface SyncMetadata {
  id: number;
  sheet_name: string;
  last_synced_at: string | null;
  last_synced_date_column: string | null;
  last_synced_row: number | null;
  total_rows_synced: number;
  total_date_columns: number;
  status: 'idle' | 'syncing' | 'error';
  error_message: string | null;
  updated_at: string;
}

export type StockRiskStatus =
  | 'OUT_OF_STOCK'
  | 'CRITICAL'
  | 'LOW_COVER'
  | 'HEALTHY'
  | 'EXCESS'
  | 'DEAD_STOCK';

export type DemandTrend = 'ACCELERATING' | 'STABLE' | 'DECLINING';

export type ABCTier = 'A' | 'B' | 'C';

export type SourcingActionPriority = 'CRITICAL' | 'ATTENTION' | 'NORMAL' | 'EXCESS';

export interface EnrichedSKUItem {
  sku_code: string;
  old_sku_code?: string | null;
  name: string;
  category: string;
  brand: string;
  sourcing: string;
  current_stock: number;
  required_qty: number;
  deficit: number;
  is_reorder: boolean;
  outward_7d: number;
  drr_7d: number;
  outward_14d: number;
  drr_14d: number;
  outward_30d: number;
  drr_30d: number;
  days_of_stock: number;
  projected_stockout_days: number;
  accel_pct: number;
  demand_trend: DemandTrend;
  risk_status: StockRiskStatus;
  abc_tier: ABCTier;
  action_priority: SourcingActionPriority;
  suggested_action: string;
  last_outward_date?: string | null;
  trend?: number[];
}

export interface SourcingBreakdownItem {
  sourcing: string;
  skuCount: number;
  totalStock: number;
  outward7d: number;
  outward14d?: number;
  avgDrr: number;
  avgDrr14d?: number;
  oosCount: number;
  reorderCount: number;
}

export interface CategoryBreakdownItem {
  category: string;
  skuCount: number;
  totalStock: number;
  outward7d: number;
  outward14d?: number;
  avgDrr: number;
  avgDrr14d?: number;
  oosCount: number;
  reorderCount: number;
}

export interface ExecutiveSummaryStats {
  totalSKUs: number;
  totalWarehouseStock: number;
  oosCount: number;
  criticalCount: number;
  lowStockCount: number;
  healthyCount: number;
  excessCount: number;
  deadStockCount: number;
  reorderCount: number;
  totalDeficitUnits: number;
  avgDaysOfStock: number;
  latestStockDate: string | null;
  latestOutwardDate: string | null;
  outwardYesterdaySkus: number;
  outwardYesterdayQty: number;
  inwardYesterdaySkus: number;
  inwardYesterdayQty: number;
  netMovementYesterday: number;
  lastSyncedAt: string | null;
}

export interface MacroStockPoint {
  date: string;
  quantity: number;
}

export interface ExecutiveOverviewData {
  stats: ExecutiveSummaryStats;
  items: EnrichedSKUItem[];
  sourcingBreakdown: SourcingBreakdownItem[];
  categoryBreakdown: CategoryBreakdownItem[];
  macroTrend: MacroStockPoint[];
  sourcingActionQueue: EnrichedSKUItem[];
  alertsState?: AlertsState;
}

export interface POIssuedRecord {
  sku_code: string;
  po_no: string;
  po_date: string;
  qty_ordered: number;
  expected_inward: string;
  notes?: string;
  created_at: string;
}

export interface AlertsState {
  ignored: string[];
  poIssued: Record<string, POIssuedRecord>;
}

