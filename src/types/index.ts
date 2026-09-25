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

export interface DRRItem {
  sku_code: string;
  product_name: string | null;
  brand: string | null;
  category: string | null;
  sourcing: string | null;
  required_qty: number;
  current_stock: number;
  drr_7d: number;
  outward_7d: number;
}

export interface InventoryStats {
  totalSKUs: number;
  totalCurrentStock: number;
  outOfStockCount: number;
  lowStockCount: number;
  excessStockCount: number;
  categoriesCount: number;
  lastSyncedAt: string | null;
}
