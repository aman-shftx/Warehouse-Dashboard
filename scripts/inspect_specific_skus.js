const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[key] = val;
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const targetSkus = [
    'CHR-20W-C2C-BRD-IP-OG',
    'CBL-C2C-W-IP-OG',
    'CBL-C2L-W-IP-OG',
    'CHR-20W-C2I-IP-OG',
    'ADP-20W-IP-OG',
    'CHR-HM-20W-C2I-LOW',
    'CHR-AL-20W-C2I-PREM',
    'CHR-HM-100W-USB2C-OP-N-F'
  ];

  const { data } = await supabase
    .from('products')
    .select('*')
    .in('sku_code', targetSkus);

  console.log(JSON.stringify(data, null, 2));
}

main();
