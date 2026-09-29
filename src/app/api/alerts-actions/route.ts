import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";
import { AlertsState, POIssuedRecord } from "@/types";
import { invalidateWarehouseIntelligenceCache } from "@/lib/analytics";

const LOCAL_DATA_FILE = path.join(process.cwd(), "data", "alerts_state.json");

function readLocalState(): AlertsState {
  try {
    if (fs.existsSync(LOCAL_DATA_FILE)) {
      const raw = fs.readFileSync(LOCAL_DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        ignored: Array.isArray(parsed.ignored) ? parsed.ignored : [],
        poIssued: typeof parsed.poIssued === "object" && parsed.poIssued !== null ? parsed.poIssued : {},
        ignoredRemarks: typeof parsed.ignoredRemarks === "object" && parsed.ignoredRemarks !== null ? parsed.ignoredRemarks : {},
        poDone: typeof parsed.poDone === "object" && parsed.poDone !== null ? parsed.poDone : {}
      };
    }
  } catch (err) {
    console.error("Error reading local alerts state:", err);
  }
  return { ignored: [], poIssued: {}, ignoredRemarks: {}, poDone: {} };
}

function writeLocalState(state: AlertsState) {
  try {
    const dir = path.dirname(LOCAL_DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing local alerts state:", err);
  }
}

async function getAlertsState(): Promise<AlertsState> {
  try {
    const { data, error } = await supabaseAdmin
      .from("sync_metadata")
      .select("error_message")
      .eq("sheet_name", "alerts_actions")
      .maybeSingle();

    if (!error && data?.error_message) {
      const parsed = JSON.parse(data.error_message);
      return {
        ignored: Array.isArray(parsed.ignored) ? parsed.ignored : [],
        poIssued: typeof parsed.poIssued === "object" && parsed.poIssued !== null ? parsed.poIssued : {},
        ignoredRemarks: typeof parsed.ignoredRemarks === "object" && parsed.ignoredRemarks !== null ? parsed.ignoredRemarks : {},
        poDone: typeof parsed.poDone === "object" && parsed.poDone !== null ? parsed.poDone : {}
      };
    }
  } catch (err) {
    console.error("Error fetching alerts state from Supabase:", err);
  }
  return readLocalState();
}

async function saveAlertsState(state: AlertsState) {
  writeLocalState(state);
  try {
    const res = await supabaseAdmin.from("sync_metadata").upsert(
      {
        sheet_name: "alerts_actions",
        status: "active",
        error_message: JSON.stringify(state),
        updated_at: new Date().toISOString()
      },
      { onConflict: "sheet_name" }
    );
    if (res.error) {
      console.error("Error saving alerts state to Supabase:", res.error);
    }
  } catch (err) {
    console.error("Error saving alerts state to Supabase:", err);
  }
}

export async function GET() {
  const state = await getAlertsState();
  return NextResponse.json(state);
}

function isSafeSkuKey(key: any): key is string {
  return (
    typeof key === "string" &&
    key.length > 0 &&
    key.length <= 120 &&
    key !== "__proto__" &&
    key !== "prototype" &&
    key !== "constructor"
  );
}

export async function POST(req: NextRequest) {
  try {
    // CSRF / Origin validation
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    const secFetchSite = req.headers.get("sec-fetch-site");

    if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
      return NextResponse.json({ error: "Forbidden: Cross-site request" }, { status: 403 });
    }

    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json({ error: "Forbidden: Cross-origin request" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
      }
    }

    const body = await req.json();
    const currentState = await getAlertsState();
    let updated = false;

    const { action, sku_code, po } = body;

    if (action === "ignore" && isSafeSkuKey(sku_code)) {
      if (!currentState.ignored.includes(sku_code)) {
        currentState.ignored.push(sku_code);
      }
      if (!currentState.ignoredRemarks) currentState.ignoredRemarks = {};
      if (body.remark && typeof body.remark === "string" && body.remark.trim()) {
        currentState.ignoredRemarks[sku_code] = body.remark.trim().slice(0, 300);
      } else {
        delete currentState.ignoredRemarks[sku_code];
      }
      delete currentState.poIssued[sku_code];
      updated = true;
    } else if (action === "unignore" && isSafeSkuKey(sku_code)) {
      currentState.ignored = currentState.ignored.filter((s) => s !== sku_code);
      if (currentState.ignoredRemarks) delete currentState.ignoredRemarks[sku_code];
      updated = true;
    } else if (action === "mark_po_done" && isSafeSkuKey(sku_code)) {
      if (!currentState.poDone) currentState.poDone = {};
      const currentPo = currentState.poIssued[sku_code];
      currentState.poDone[sku_code] = {
        sku_code,
        po_no: String(currentPo?.po_no || body.po_no || "PO-DONE").slice(0, 50),
        po_date: String(currentPo?.po_date || new Date().toISOString().substring(0, 10)).slice(0, 20),
        qty_ordered: Math.max(0, Math.min(1000000, Number(currentPo?.qty_ordered) || 0)),
        expected_inward: String(currentPo?.expected_inward || "").slice(0, 20),
        notes: String(currentPo?.notes || "").slice(0, 300),
        done_at: new Date().toISOString(),
        remark: String(body.remark || "").trim().slice(0, 300)
      };
      delete currentState.poIssued[sku_code];
      updated = true;
    } else if (action === "reopen_po" && isSafeSkuKey(sku_code)) {
      if (currentState.poDone && currentState.poDone[sku_code]) {
        const doneItem = currentState.poDone[sku_code];
        currentState.poIssued[sku_code] = {
          sku_code: doneItem.sku_code,
          po_no: doneItem.po_no,
          po_date: doneItem.po_date,
          qty_ordered: doneItem.qty_ordered,
          expected_inward: doneItem.expected_inward,
          notes: doneItem.notes,
          created_at: new Date().toISOString()
        };
        delete currentState.poDone[sku_code];
        updated = true;
      }
    } else if (action === "issue_po" && po && isSafeSkuKey(po.sku_code)) {
      currentState.poIssued[po.sku_code] = {
        sku_code: po.sku_code,
        po_no: String(po.po_no || "PO-" + Date.now().toString().slice(-6)).slice(0, 50),
        po_date: String(po.po_date || new Date().toISOString().substring(0, 10)).slice(0, 20),
        qty_ordered: Math.max(0, Math.min(1000000, Number(po.qty_ordered) || 0)),
        expected_inward: String(po.expected_inward || "").slice(0, 20),
        notes: String(po.notes || "").slice(0, 300),
        created_at: new Date().toISOString()
      };
      // Ensure it is not in ignored
      currentState.ignored = currentState.ignored.filter((s) => s !== po.sku_code);
      if (currentState.ignoredRemarks) delete currentState.ignoredRemarks[po.sku_code];
      if (currentState.poDone) delete currentState.poDone[po.sku_code];
      updated = true;
    } else if (action === "cancel_po" && isSafeSkuKey(sku_code)) {
      delete currentState.poIssued[sku_code];
      updated = true;
    } else if (action === "sync_full" && body.state) {
      if (Array.isArray(body.state.ignored)) {
        currentState.ignored = body.state.ignored.filter(isSafeSkuKey);
      }
      if (typeof body.state.poIssued === "object" && body.state.poIssued !== null) {
        const safePo: Record<string, any> = {};
        for (const [k, v] of Object.entries(body.state.poIssued)) {
          if (isSafeSkuKey(k)) safePo[k] = v;
        }
        currentState.poIssued = safePo;
      }
      if (typeof body.state.ignoredRemarks === "object" && body.state.ignoredRemarks !== null) {
        const safeRemarks: Record<string, string> = {};
        for (const [k, v] of Object.entries(body.state.ignoredRemarks)) {
          if (isSafeSkuKey(k) && typeof v === "string") safeRemarks[k] = v.slice(0, 300);
        }
        currentState.ignoredRemarks = safeRemarks;
      }
      if (typeof body.state.poDone === "object" && body.state.poDone !== null) {
        const safePoDone: Record<string, any> = {};
        for (const [k, v] of Object.entries(body.state.poDone)) {
          if (isSafeSkuKey(k)) safePoDone[k] = v;
        }
        currentState.poDone = safePoDone;
      }
      updated = true;
    }

    if (updated) {
      await saveAlertsState(currentState);
      invalidateWarehouseIntelligenceCache();
      try {
        revalidatePath("/");
        revalidatePath("/alerts");
      } catch (e) {}
    }

    return NextResponse.json({ success: true, state: currentState });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update alerts action" }, { status: 500 });
  }
}
