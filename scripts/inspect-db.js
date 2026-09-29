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

async function inspectDb() {
  console.log("=== SUPABASE DATABASE AUDIT ===");
  
  // 1. Table Counts
  const tables = ['products', 'daily_stock', 'inward_transactions', 'outward_transactions', 'sync_metadata'];
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`Table ${t}: ${count} rows (err: ${error?.message || 'none'})`);
  }

  // 2. Sync metadata records
  const { data: syncMeta } = await supabase.from('sync_metadata').select('*');
  console.log("\n=== SYNC METADATA ===");
  console.log(syncMeta);

  // 3. Products sample
  const { data: prodSample } = await supabase.from('products').select('*').limit(3);
  console.log("\n=== PRODUCTS SAMPLE ===");
  console.log(prodSample);

  // 4. Daily stock min/max dates
  const { data: dsMin } = await supabase.from('daily_stock').select('date').order('date', { ascending: true }).limit(1);
  const { data: dsMax } = await supabase.from('daily_stock').select('date').order('date', { ascending: false }).limit(1);
  console.log("\n=== DAILY STOCK DATE RANGE ===");
  console.log(`Min date: ${dsMin?.[0]?.date}, Max date: ${dsMax?.[0]?.date}`);

  // 5. Outward transactions min/max dates
  const { data: otMin } = await supabase.from('outward_transactions').select('date').order('date', { ascending: true }).limit(1);
  const { data: otMax } = await supabase.from('outward_transactions').select('date').order('date', { ascending: false }).limit(1);
  console.log("\n=== OUTWARD TRANSACTIONS DATE RANGE ===");
  console.log(`Min date: ${otMin?.[0]?.date}, Max date: ${otMax?.[0]?.date}`);

  // 6. Inward transactions min/max dates
  const { data: inMin } = await supabase.from('inward_transactions').select('date').order('date', { ascending: true }).limit(1);
  const { data: inMax } = await supabase.from('inward_transactions').select('date').order('date', { ascending: false }).limit(1);
  console.log("\n=== INWARD TRANSACTIONS DATE RANGE ===");
  console.log(`Min date: ${inMin?.[0]?.date}, Max date: ${inMax?.[0]?.date}`);
}

inspectDb().catch(console.error);
