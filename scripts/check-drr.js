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

async function checkDrr() {
  // Check latest date in outward_transactions
  const { data: maxRow } = await supabase.from('outward_transactions').select('date').order('date', { ascending: false }).limit(1);
  const maxDate = maxRow?.[0]?.date;
  console.log("Latest outward date:", maxDate);

  // Check outward volume in last 7 days from maxDate
  const d7 = new Date(maxDate);
  d7.setDate(d7.getDate() - 7);
  const d7Str = d7.toISOString();

  const d30 = new Date(maxDate);
  d30.setDate(d30.getDate() - 30);
  const d30Str = d30.toISOString();

  console.log("7D window:", d7Str, "to", maxDate);
  console.log("30D window:", d30Str, "to", maxDate);

  const { data: rows7 } = await supabase.from('outward_transactions').select('sku_code, quantity').gte('date', d7Str).lte('date', maxDate);
  const sku7Map = new Map();
  rows7.forEach(r => sku7Map.set(r.sku_code, (sku7Map.get(r.sku_code) || 0) + r.quantity));

  console.log(`SKUs with outward in 7D window: ${sku7Map.size}, total units: ${rows7.reduce((s, r) => s + r.quantity, 0)}`);

  const top5 = Array.from(sku7Map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  console.log("Top 5 7D movers:", top5);
}

checkDrr().catch(console.error);
