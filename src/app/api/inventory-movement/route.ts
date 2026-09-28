import { NextRequest, NextResponse } from "next/server";
import { getInventoryMovement } from "@/lib/movement";

export const revalidate = 60; // Cache 60s

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const daysParam = searchParams.get("days") || "1";
  const numDays = Math.max(1, parseInt(daysParam, 10) || 1);

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
