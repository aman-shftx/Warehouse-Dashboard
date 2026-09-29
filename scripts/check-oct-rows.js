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

async function checkRow() {
  const { data: rows } = await supabase.from('outward_transactions')
    .select('sheet_row_number, date, sku_code, quantity')
    .gte('date', '2026-10-01')
    .order('sheet_row_number', { ascending: true });
  console.log("October rows:", rows);

  if (rows && rows.length > 0) {
    const rNum = rows[0].sheet_row_number;
    const { data: neighborRows } = await supabase.from('outward_transactions')
      .select('sheet_row_number, date, sku_code, quantity')
      .gte('sheet_row_number', rNum - 5)
      .lte('sheet_row_number', rNum + 5)
      .order('sheet_row_number', { ascending: true });
    console.log("Neighbors of row", rNum, ":", neighborRows);
  }
}

checkRow().catch(console.error);
