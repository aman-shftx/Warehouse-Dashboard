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

async function fix() {
  const { data, error } = await supabase.from('outward_transactions')
    .update({ date: '2026-04-10T00:00:00.000Z' })
    .eq('date', '2026-10-04T00:00:00+00:00')
    .select('id, sku_code, date');
  console.log('Updated rows:', data?.length, error);

  // Check what the new latest outward date is!
  const { data: maxRow } = await supabase.from('outward_transactions').select('date').order('date', { ascending: false }).limit(1);
  console.log("New max date in outward_transactions:", maxRow?.[0]?.date);
}

fix().catch(console.error);
