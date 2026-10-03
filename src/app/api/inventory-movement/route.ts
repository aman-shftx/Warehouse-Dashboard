import { NextRequest, NextResponse } from "next/server";
import { getInventoryMovement } from "@/lib/movement";

export const revalidate = 60; // Cache 60s

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const startParam = searchParams.get("startDate");
  const endParam = searchParams.get("endDate");
  const daysParam = searchParams.get("days");

  try {
    let data;
    if (dateParam) {
      data = await getInventoryMovement({ date: dateParam });
    } else if (startParam && endParam) {
      data = await getInventoryMovement({ startDate: startParam, endDate: endParam });
    } else {
      const parsed = parseInt(daysParam || "1", 10);
      const numDays = Math.min(90, Math.max(1, isNaN(parsed) ? 1 : parsed));
      data = await getInventoryMovement({ days: numDays });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error computing inventory movement:", err);
    return NextResponse.json(
      { error: err.message || "Failed to compute movement" },
      { status: 500 }
    );
  }
}
