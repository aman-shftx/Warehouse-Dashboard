import { NextResponse } from "next/server";
import { syncAllSheets, syncStockSheet, syncInwardData, syncOutwardData, syncSKUCatalog } from "@/lib/sync/sync-service";

export const maxDuration = 300; // Allow up to 5 minutes on Vercel Pro if needed
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const sheet = searchParams.get("sheet");

  const expectedSecret = process.env.SYNC_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    return NextResponse.json({
      success: true,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Sync failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Allow manual sync trigger from dashboard
  return GET(request);
}
