import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import crypto from "crypto";
import { syncAllSheets, syncStockSheet, syncInwardData, syncOutwardData, syncSKUCatalog } from "@/lib/sync/sync-service";
import { invalidateWarehouseIntelligenceCache } from "@/lib/analytics";
import { invalidateInventoryMovementCache } from "@/lib/movement";

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

  // Purge intelligence and movement caches so fresh data is loaded on the next view
  invalidateWarehouseIntelligenceCache();
  invalidateInventoryMovementCache();
  try {
    revalidateTag("warehouse-intelligence");
    revalidateTag("movement-data");
    revalidateTag("product-catalog");
    revalidatePath("/", "layout");
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

function safeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function isAuthorized(request: Request): boolean {
  const expectedSecret = process.env.SYNC_SECRET;

  // Check Authorization Bearer header
  const authHeader = request.headers.get("authorization");
  if (expectedSecret && authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (safeCompare(token, expectedSecret)) return true;
  }

  // Check ?secret= query parameter
  const { searchParams } = new URL(request.url);
  const secretParam = searchParams.get("secret");
  if (expectedSecret && secretParam) {
    if (safeCompare(secretParam, expectedSecret)) return true;
  }

  // Allow trusted same-origin calls initiated by dashboard user interface
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const secFetchSite = request.headers.get("sec-fetch-site");

  if (secFetchSite === "same-origin") {
    return true;
  }

  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return true;
    } catch {}
  }

  // If SYNC_SECRET is not configured at all (local dev), permit local requests
  if (!expectedSecret && (host?.startsWith("localhost") || host?.startsWith("127.0.0.1"))) {
    return true;
  }

  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sheet = searchParams.get("sheet");

  try {
    const data = await executeSync(sheet);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Sync failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sheet = searchParams.get("sheet");
  try {
    const data = await executeSync(sheet);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Sync failed" }, { status: 500 });
  }
}
