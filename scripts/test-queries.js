const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log("=== CHECK v_daily_run_rate ===");
  const { data: drr, error: drrErr } = await supabase.from('v_daily_run_rate').select('*').limit(5);
  console.log("DRR sample:", drr, drrErr);

  console.log("\n=== CHECK v_current_stock ===");
  const { data: cs, error: csErr } = await supabase.from('v_current_stock').select('*').limit(3);
  console.log("Current stock sample:", cs, csErr);

  console.log("\n=== OUTWARD TRANSACTIONS RECENT DATES ===");
  const { data: otRecent } = await supabase.from('outward_transactions').select('date, quantity, sku_code').order('date', { ascending: false }).limit(5);
  console.log("Recent outward:", otRecent);
}

test().catch(console.error);
