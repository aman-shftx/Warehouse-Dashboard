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

async function benchmarkAnalytics() {
  const t0 = Date.now();

  const [{ data: dsLatest }, { data: otLatest }, { data: products }, { data: currentStockRows }] = await Promise.all([
    supabase.from('daily_stock').select('date').order('date', { ascending: false }).limit(1),
    supabase.from('outward_transactions').select('date').order('date', { ascending: false }).limit(1),
    supabase.from('products').select('*'),
    supabase.from('v_current_stock').select('*')
  ]);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const past30Days = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    past30Days.push(dStr);
  }

  const d30Start = `${past30Days[29]}T00:00:00.000Z`;
  const todayEnd = `${todayStr}T23:59:59.999Z`;

  let allOutward30d = [];
  let offset = 0;
  while (true) {
    const { data: page } = await supabase
      .from('outward_transactions')
      .select('sku_code, date, quantity')
      .gte('date', d30Start)
      .lte('date', todayEnd)
      .order('id', { ascending: true })
      .range(offset, offset + 999);
    
    if (!page || page.length === 0) break;
    allOutward30d.push(...page);
    if (page.length < 1000) break;
    offset += 1000;
  }

  const prodOldMap = new Map();
  (products || []).forEach(p => {
    if (p.old_sku_code) prodOldMap.set(p.old_sku_code, p.sku_code);
  });

  const dateToDayIndex = new Map();
  past30Days.forEach((dStr, idx) => dateToDayIndex.set(dStr, idx));

  const skuDailyOutwardMap = new Map();

  allOutward30d.forEach(r => {
    const canonical = prodOldMap.get(r.sku_code) || r.sku_code;
    const qty = r.quantity || 0;
    const dayStr = r.date.substring(0, 10);
    const dayIdx = dateToDayIndex.get(dayStr);
    if (dayIdx !== undefined && dayIdx >= 0 && dayIdx < 30) {
      let arr = skuDailyOutwardMap.get(canonical);
      if (!arr) {
        arr = new Array(30).fill(0);
        skuDailyOutwardMap.set(canonical, arr);
      }
      arr[dayIdx] += qty;
    }
  });

  const enriched = (currentStockRows || []).map(item => {
    const currentStock = item.current_stock || 0;
    const trend = skuDailyOutwardMap.get(item.sku_code) || new Array(30).fill(0);
    const out7 = trend.slice(0, 7).reduce((a, b) => a + b, 0);
    const out14 = trend.slice(0, 14).reduce((a, b) => a + b, 0);
    const out30 = trend.slice(0, 30).reduce((a, b) => a + b, 0);

    const drr7d = parseFloat((out7 / 7.0).toFixed(2));
    const drr14d = parseFloat((out14 / 14.0).toFixed(2));
    const drr30d = parseFloat((out30 / 30.0).toFixed(2));

    const coverDays = drr14d > 0 ? parseFloat((currentStock / drr14d).toFixed(1)) : 999;

    return {
      sku: item.sku_code,
      name: item.product_name,
      stock: currentStock,
      out7,
      drr7d,
      out14,
      drr14d,
      out30,
      drr30d,
      coverDays
    };
  });

  enriched.sort((a, b) => b.drr14d - a.drr14d);

  console.log(`Analytics engine took ${Date.now() - t0}ms for ${enriched.length} SKUs.`);
  console.log(`\nTop 15 High Velocity SKUs by 14D Standard DRR:`);
  enriched.slice(0, 15).forEach((item, idx) => {
    console.log(`${idx + 1}. [${item.sku}] Stock=${item.stock} | 7D Outward=${item.out7} (DRR=${item.drr7d}/d) | 14D Outward=${item.out14} (DRR=${item.drr14d}/d) | 30D Outward=${item.out30} (DRR=${item.drr30d}/d) | Cover=${item.coverDays}d`);
  });
}

benchmarkAnalytics();
