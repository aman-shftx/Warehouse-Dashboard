import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const revalidate = 60; // Cache 60 seconds

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sku = searchParams.get("sku");

  if (!sku || typeof sku !== "string") {
    return NextResponse.json({ error: "Missing or invalid sku parameter" }, { status: 400 });
  }

  const cleanSku = sku.trim();
  if (cleanSku.length === 0 || cleanSku.length > 120 || !/^[a-zA-Z0-9_\-\.\/\s]+$/.test(cleanSku)) {
    return NextResponse.json({ error: "Invalid SKU format" }, { status: 400 });
  }

  try {
    // 1. Fetch product master by sku_code or old_sku_code using safe parameterized filter
    let { data: product } = await supabaseAdmin
      .from("products")
      .select("sku_code, old_sku_code, product_name, brand, category, current_stock:v_current_stock(current_stock)")
      .eq("sku_code", cleanSku)
      .maybeSingle();

    if (!product) {
      const { data: oldSkuMatch } = await supabaseAdmin
        .from("products")
        .select("sku_code, old_sku_code, product_name, brand, category, current_stock:v_current_stock(current_stock)")
        .eq("old_sku_code", cleanSku)
        .maybeSingle();
      product = oldSkuMatch;
    }

    const targetSku = product?.sku_code || cleanSku;

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
