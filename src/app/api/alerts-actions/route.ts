import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";
import { AlertsState, POIssuedRecord } from "@/types";

const LOCAL_DATA_FILE = path.join(process.cwd(), "data", "alerts_state.json");

function readLocalState(): AlertsState {
  try {
    if (fs.existsSync(LOCAL_DATA_FILE)) {
      const raw = fs.readFileSync(LOCAL_DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        ignored: Array.isArray(parsed.ignored) ? parsed.ignored : [],
        poIssued: typeof parsed.poIssued === "object" && parsed.poIssued !== null ? parsed.poIssued : {}
      };
    }
  } catch (err) {
    console.error("Error reading local alerts state:", err);
  }
  return { ignored: [], poIssued: {} };
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
        poIssued: typeof parsed.poIssued === "object" && parsed.poIssued !== null ? parsed.poIssued : {}
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const currentState = await getAlertsState();
    let updated = false;

    const { action, sku_code, po } = body;

    if (action === "ignore" && sku_code) {
      if (!currentState.ignored.includes(sku_code)) {
        currentState.ignored.push(sku_code);
      }
      // If it had a PO, we leave it or remove it
      delete currentState.poIssued[sku_code];
      updated = true;
    } else if (action === "unignore" && sku_code) {
      currentState.ignored = currentState.ignored.filter((s) => s !== sku_code);
      updated = true;
    } else if (action === "issue_po" && po && po.sku_code) {
      currentState.poIssued[po.sku_code] = {
        sku_code: po.sku_code,
        po_no: po.po_no || "PO-" + Date.now().toString().slice(-6),
        po_date: po.po_date || new Date().toISOString().substring(0, 10),
        qty_ordered: Number(po.qty_ordered) || 0,
        expected_inward: po.expected_inward || "",
        notes: po.notes || "",
        created_at: new Date().toISOString()
      };
      // Ensure it is not in ignored
      currentState.ignored = currentState.ignored.filter((s) => s !== po.sku_code);
      updated = true;
    } else if (action === "cancel_po" && sku_code) {
      delete currentState.poIssued[sku_code];
      updated = true;
    } else if (action === "sync_full" && body.state) {
      currentState.ignored = Array.isArray(body.state.ignored) ? body.state.ignored : currentState.ignored;
      currentState.poIssued = typeof body.state.poIssued === "object" ? body.state.poIssued : currentState.poIssued;
      updated = true;
    }

    if (updated) {
      await saveAlertsState(currentState);
    }

    return NextResponse.json({ success: true, state: currentState });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update alerts action" }, { status: 500 });
  }
}
