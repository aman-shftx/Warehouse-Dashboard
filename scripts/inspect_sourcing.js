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
  const { data, error } = await supabase
    .from('products')
    .select('sku_code, product_name, sourcing, category, brand');

  if (error) {
    console.error(error);
    return;
  }

  const distinct = {};
  data.forEach(p => {
    const s = p.sourcing || 'NULL';
    if (!distinct[s]) distinct[s] = [];
    distinct[s].push(p);
  });

  console.log('--- SOURCING VALUES SUMMARY ---');
  for (const [s, items] of Object.entries(distinct)) {
    console.log(`\nSourcing: "${s}" (${items.length} SKUs):`);
    items.forEach(i => console.log(`   [${i.sku_code}] "${i.product_name}" | Category: ${i.category} | Brand: ${i.brand}`));
  }
}

main();
