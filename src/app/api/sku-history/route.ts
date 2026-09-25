import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const revalidate = 60; // Cache 60 seconds

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sku = searchParams.get("sku");

  if (!sku) {
    return NextResponse.json({ error: "Missing sku parameter" }, { status: 400 });
  }

  try {
    // 1. Fetch product master to check if old_sku_code is also used
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("sku_code, old_sku_code, product_name, brand, category, current_stock:v_current_stock(current_stock)")
      .or(`sku_code.eq.${sku},old_sku_code.eq.${sku}`)
      .maybeSingle();

    const targetSku = product?.sku_code || sku;

    // 2. Fetch daily stock history
    const { data: history, error } = await supabaseAdmin
      .from("daily_stock")
      .select("date, quantity")
      .eq("sku_code", targetSku)
      .order("date", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      sku: targetSku,
      productName: product?.product_name || targetSku,
      data: history || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
