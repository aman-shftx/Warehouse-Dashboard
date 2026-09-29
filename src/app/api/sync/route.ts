import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { syncAllSheets, syncStockSheet, syncInwardData, syncOutwardData, syncSKUCatalog } from "@/lib/sync/sync-service";
import { invalidateWarehouseIntelligenceCache } from "@/lib/analytics";

export const maxDuration = 300; // Allow up to 5 minutes on Vercel Pro if needed
export const dynamic = "force-dynamic";

async function executeSync(sheet: string | null) {
  const startTime = Date.now();
  let results;

  if (sheet === "stock") {
    results = [await syncStockSheet()];
  } else if (sheet === "catalog") {
    results = [await syncSKUCatalog()];
  } else if (sheet === "inward") {
    results = [await syncInwardData()];
  } else if (sheet === "outward") {
    results = [await syncOutwardData()];
  } else {
    results = await syncAllSheets();
  }

  // Purge intelligence caches so fresh data is loaded on the next view
  invalidateWarehouseIntelligenceCache();
  try {
    revalidatePath("/");
    revalidatePath("/analytics");
    revalidatePath("/alerts");
    revalidatePath("/inventory");
    revalidatePath("/movement");
  } catch (e) {}

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  return {
    success: true,
    duration: `${duration}s`,
    timestamp: new Date().toISOString(),
    results,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const sheet = searchParams.get("sheet");

  const expectedSecret = process.env.SYNC_SECRET;
  // If secret is set and provided secret doesn't match
  if (expectedSecret && secret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await executeSync(sheet);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Sync failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const sheet = searchParams.get("sheet");
  try {
    const data = await executeSync(sheet);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Sync failed" }, { status: 500 });
  }
}
