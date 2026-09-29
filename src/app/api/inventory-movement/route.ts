import { NextRequest, NextResponse } from "next/server";
import { getInventoryMovement } from "@/lib/movement";

export const revalidate = 60; // Cache 60s

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const daysParam = searchParams.get("days") || "1";
  const parsed = parseInt(daysParam, 10);
  const numDays = Math.min(90, Math.max(1, isNaN(parsed) ? 1 : parsed));

  try {
    const data = await getInventoryMovement(numDays);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error computing inventory movement:", err);
    return NextResponse.json(
      { error: err.message || "Failed to compute movement" },
      { status: 500 }
    );
  }
}
