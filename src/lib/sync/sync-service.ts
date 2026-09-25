import { fetchSheetValues } from "@/lib/google-sheets/client";
import { supabaseAdmin } from "@/lib/supabase/server";

// Helper: Normalize date string from Google Sheet to YYYY-MM-DD
export function parseSheetDate(rawDate: string): string | null {
  if (!rawDate) return null;
  const trimmed = rawDate.trim();
  if (!trimmed || trimmed.toLowerCase().includes("कुल") || trimmed.toLowerCase().includes("total")) {
    return null;
  }

  // Handle ISO format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.substring(0, 10);
  }

  // Handle DD/MM/YYYY or D/M/YYYY or DD-MM-YYYY
  const parts = trimmed.split(/[/ -]/);
  if (parts.length >= 3) {
    let p1 = parseInt(parts[0], 10);
    let p2 = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);

    if (isNaN(year)) return null;
    if (year < 100) year += 2000;

    // Detect if p1 is day or month (Indian sheets typically use DD/MM/YYYY)
    // If p1 > 12, p1 is definitely day
    let day = p1;
    let month = p2;
    if (p2 > 12 && p1 <= 12) {
      // MM/DD/YYYY format
      day = p2;
      month = p1;
    }

    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  }

  return null;
}

// Helper: Parse DateTime for transactions (e.g. "23-09-2026 14:12" or "07/01/2026")
export function parseSheetDateTime(raw: string): string {
  if (!raw) return new Date().toISOString();
  const trimmed = raw.trim();

  // Try parsing directly
  const dateOnly = parseSheetDate(trimmed);
  if (!dateOnly) return new Date().toISOString();

  // Check if time is included (e.g., "14:12" or "14:12:00")
  const timeMatch = trimmed.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (timeMatch) {
    const hh = String(timeMatch[1]).padStart(2, "0");
    const mm = String(timeMatch[2]).padStart(2, "0");
    const ss = timeMatch[3] ? String(timeMatch[3]).padStart(2, "0") : "00";
    return `${dateOnly}T${hh}:${mm}:${ss}.000Z`;
  }

  return `${dateOnly}T00:00:00.000Z`;
}

// Helper: Clean integer quantity
function parseQuantity(raw: any): number {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === "number") return Math.round(raw);
  const cleaned = String(raw).replace(/,/g, "").trim();
  const n = parseInt(cleaned, 10);
  return isNaN(n) ? 0 : n;
}

export interface SyncResult {
  sheet: string;
  success: boolean;
  rowsProcessed: number;
  message: string;
}

// 1. Sync SKU-Cat-Name (Product Master Catalog)
export async function syncSKUCatalog(): Promise<SyncResult> {
  try {
    const rows = await fetchSheetValues("'SKU-Cat-Name'!A2:H1200");
    if (!rows || rows.length < 2) {
      return { sheet: "SKU-Cat-Name", success: true, rowsProcessed: 0, message: "No rows found" };
    }

    // Row 0 is headers: new-sku code, OLD _SKU_ Code, PRODUCT NAME, TYPE, Brand, category, Required_ Qty, Current _Stock
    const productsToUpsert = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const skuCode = (row[0] || "").trim();
      if (!skuCode || skuCode.toLowerCase().includes("कुल") || skuCode.toLowerCase().includes("total")) {
        continue;
      }

      productsToUpsert.push({
        sku_code: skuCode,
        old_sku_code: (row[1] || "").trim() || null,
        product_name: (row[2] || "").trim() || null,
        sourcing: (row[3] || "").trim() || null,
        brand: (row[4] || "").trim() || null,
        category: (row[5] || "").trim() || null,
        required_qty: parseQuantity(row[6]),
        updated_at: new Date().toISOString(),
      });
    }

    if (productsToUpsert.length > 0) {
      const { error } = await supabaseAdmin
        .from("products")
        .upsert(productsToUpsert, { onConflict: "sku_code" });

      if (error) throw error;
    }

    await supabaseAdmin.from("sync_metadata").upsert({
      sheet_name: "SKU-Cat-Name",
      last_synced_at: new Date().toISOString(),
      total_rows_synced: productsToUpsert.length,
      status: "idle",
      error_message: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "sheet_name" });

    return {
      sheet: "SKU-Cat-Name",
      success: true,
      rowsProcessed: productsToUpsert.length,
      message: `Upserted ${productsToUpsert.length} products`,
    };
  } catch (err: any) {
    console.error("Error in syncSKUCatalog:", err);
    await supabaseAdmin.from("sync_metadata").upsert({
      sheet_name: "SKU-Cat-Name",
      status: "error",
      error_message: err.message,
      updated_at: new Date().toISOString(),
    }, { onConflict: "sheet_name" });
    return { sheet: "SKU-Cat-Name", success: false, rowsProcessed: 0, message: err.message };
  }
}

// 2. Sync Stock Sheet (Daily Stock Time-Series)
export async function syncStockSheet(): Promise<SyncResult> {
  try {
    // Fetch all stock sheet data
    const rows = await fetchSheetValues("'Stock Sheet'!A2:EE600");
    if (!rows || rows.length < 3) {
      return { sheet: "Stock Sheet", success: true, rowsProcessed: 0, message: "No data found" };
    }

    // Row 0 of fetched data is Row 2 of sheet:
    // ['Sourcing', 'Brand', 'Product Name', 'Category', 'SKU CODE ', '', '7/4/2026', '05/07/2026', ...]
    const headerRow = rows[0];

    // Find date columns: Start scanning from index 5 or 6
    const dateColumns: { colIndex: number; dateStr: string }[] = [];
    for (let c = 5; c < headerRow.length; c++) {
      const val = headerRow[c];
      if (!val) continue;
      const lower = val.toLowerCase().trim();
      if (lower.includes("कुल") || lower.includes("total")) {
        // Skip Grand Total column
        continue;
      }
      const parsedDate = parseSheetDate(val);
      if (parsedDate) {
        dateColumns.push({ colIndex: c, dateStr: parsedDate });
      }
    }

    if (dateColumns.length === 0) {
      return { sheet: "Stock Sheet", success: false, rowsProcessed: 0, message: "No valid date columns found" };
    }

    const latestDateColumn = dateColumns[dateColumns.length - 1].dateStr;

    // First ensure products from Stock Sheet exist in products table
    const productsFromStock = [];
    const dailyStockRecords = [];

    // Rows start from index 2 (skipping subheader row at index 1)
    for (let r = 2; r < rows.length; r++) {
      const row = rows[r];
      const skuCode = (row[4] || "").trim();
      if (!skuCode || skuCode.toLowerCase().includes("कुल") || skuCode.toLowerCase().includes("total")) {
        continue;
      }

      productsFromStock.push({
        sku_code: skuCode,
        product_name: (row[2] || "").trim() || null,
        brand: (row[1] || "").trim() || null,
        category: (row[3] || "").trim() || null,
        sourcing: (row[0] || "").trim() || null,
        updated_at: new Date().toISOString(),
      });

      // Extract daily stock for each date
      for (const dc of dateColumns) {
        const rawQty = row[dc.colIndex];
        const qty = parseQuantity(rawQty);
        dailyStockRecords.push({
          sku_code: skuCode,
          date: dc.dateStr,
          quantity: qty,
        });
      }
    }

    // Upsert products from stock sheet
    if (productsFromStock.length > 0) {
      await supabaseAdmin
        .from("products")
        .upsert(productsFromStock, { onConflict: "sku_code" });
    }

    // Upsert daily_stock in batches of 1000
    const BATCH_SIZE = 1000;
    for (let i = 0; i < dailyStockRecords.length; i += BATCH_SIZE) {
      const batch = dailyStockRecords.slice(i, i + BATCH_SIZE);
      const { error } = await supabaseAdmin
        .from("daily_stock")
        .upsert(batch, { onConflict: "sku_code,date" });
      if (error) throw error;
    }

    await supabaseAdmin.from("sync_metadata").upsert({
      sheet_name: "Stock Sheet",
      last_synced_at: new Date().toISOString(),
      last_synced_date_column: latestDateColumn,
      total_rows_synced: dailyStockRecords.length,
      total_date_columns: dateColumns.length,
      status: "idle",
      error_message: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "sheet_name" });

    return {
      sheet: "Stock Sheet",
      success: true,
      rowsProcessed: dailyStockRecords.length,
      message: `Synced ${dailyStockRecords.length} stock points across ${dateColumns.length} dates`,
    };
  } catch (err: any) {
    console.error("Error in syncStockSheet:", err);
    await supabaseAdmin.from("sync_metadata").upsert({
      sheet_name: "Stock Sheet",
      status: "error",
      error_message: err.message,
      updated_at: new Date().toISOString(),
    }, { onConflict: "sheet_name" });
    return { sheet: "Stock Sheet", success: false, rowsProcessed: 0, message: err.message };
  }
}

// 3. Sync Inward Data (Transactional log)
export async function syncInwardData(): Promise<SyncResult> {
  try {
    // Check last synced row
    const { data: meta } = await supabaseAdmin
      .from("sync_metadata")
      .select("last_synced_row")
      .eq("sheet_name", "Inward Data")
      .single();

    const lastRow = meta?.last_synced_row || 2; // header is row 2
    const startRow = lastRow + 1;

    // Fetch new rows starting from startRow
    const rows = await fetchSheetValues(`'Inward Data'!A${startRow}:E${startRow + 5000}`);
    if (!rows || rows.length === 0) {
      return { sheet: "Inward Data", success: true, rowsProcessed: 0, message: "Already up to date" };
    }

    const records = [];
    let currentRow = startRow;
    for (const row of rows) {
      const rawDate = row[0];
      const skuCode = (row[1] || "").trim();
      const qty = parseQuantity(row[2]);

      if (rawDate && skuCode) {
        records.push({
          sku_code: skuCode,
          date: parseSheetDateTime(rawDate),
          quantity: qty,
          remark: row[3] ? String(row[3]).trim() : null,
          reference_no: row[4] ? String(row[4]).trim() : null,
          sheet_row_number: currentRow,
        });
      }
      currentRow++;
    }

    if (records.length > 0) {
      const BATCH_SIZE = 1000;
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const { error } = await supabaseAdmin.from("inward_transactions").insert(batch);
        if (error) throw error;
      }
    }

    const finalRow = startRow + rows.length - 1;
    await supabaseAdmin.from("sync_metadata").upsert({
      sheet_name: "Inward Data",
      last_synced_at: new Date().toISOString(),
      last_synced_row: finalRow,
      total_rows_synced: records.length,
      status: "idle",
      error_message: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "sheet_name" });

    return {
      sheet: "Inward Data",
      success: true,
      rowsProcessed: records.length,
      message: `Appended ${records.length} inward records up to row ${finalRow}`,
    };
  } catch (err: any) {
    console.error("Error in syncInwardData:", err);
    await supabaseAdmin.from("sync_metadata").upsert({
      sheet_name: "Inward Data",
      status: "error",
      error_message: err.message,
      updated_at: new Date().toISOString(),
    }, { onConflict: "sheet_name" });
    return { sheet: "Inward Data", success: false, rowsProcessed: 0, message: err.message };
  }
}

// 4. Sync OutWard Data (Transactional log)
export async function syncOutwardData(): Promise<SyncResult> {
  try {
    // Check last synced row
    const { data: meta } = await supabaseAdmin
      .from("sync_metadata")
      .select("last_synced_row")
      .eq("sheet_name", "OutWard Data")
      .single();

    const lastRow = meta?.last_synced_row || 2; // header is row 2
    const startRow = lastRow + 1;

    // Fetch batch (up to 10,000 rows)
    const rows = await fetchSheetValues(`'OutWard Data'!A${startRow}:D${startRow + 10000}`);
    if (!rows || rows.length === 0) {
      return { sheet: "OutWard Data", success: true, rowsProcessed: 0, message: "Already up to date" };
    }

    const records = [];
    let currentRow = startRow;
    for (const row of rows) {
      const rawDate = row[0];
      const skuCode = (row[1] || "").trim();
      const qty = parseQuantity(row[2]);

      if (rawDate && skuCode) {
        records.push({
          sku_code: skuCode,
          date: parseSheetDateTime(rawDate),
          quantity: qty,
          gatepass_no: row[3] ? String(row[3]).trim() : null,
          sheet_row_number: currentRow,
        });
      }
      currentRow++;
    }

    if (records.length > 0) {
      const BATCH_SIZE = 1000;
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const { error } = await supabaseAdmin.from("outward_transactions").insert(batch);
        if (error) throw error;
      }
    }

    const finalRow = startRow + rows.length - 1;
    await supabaseAdmin.from("sync_metadata").upsert({
      sheet_name: "OutWard Data",
      last_synced_at: new Date().toISOString(),
      last_synced_row: finalRow,
      total_rows_synced: records.length,
      status: "idle",
      error_message: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "sheet_name" });

    return {
      sheet: "OutWard Data",
      success: true,
      rowsProcessed: records.length,
      message: `Appended ${records.length} outward records up to row ${finalRow}`,
    };
  } catch (err: any) {
    console.error("Error in syncOutwardData:", err);
    await supabaseAdmin.from("sync_metadata").upsert({
      sheet_name: "OutWard Data",
      status: "error",
      error_message: err.message,
      updated_at: new Date().toISOString(),
    }, { onConflict: "sheet_name" });
    return { sheet: "OutWard Data", success: false, rowsProcessed: 0, message: err.message };
  }
}

// Master Sync All Function
export async function syncAllSheets() {
  const results: SyncResult[] = [];

  // Order: 1) SKU Catalog -> 2) Stock Sheet -> 3) Inward Data -> 4) OutWard Data
  results.push(await syncSKUCatalog());
  results.push(await syncStockSheet());
  results.push(await syncInwardData());
  results.push(await syncOutwardData());

  return results;
}
