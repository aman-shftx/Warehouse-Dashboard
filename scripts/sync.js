const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
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
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const https = require('https');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function base64url(buf) {
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

let cachedToken = null;
async function getGoogleAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) return cachedToken.token;

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n');

  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };

  const signInput = `${base64url(Buffer.from(JSON.stringify(header)))}.${base64url(Buffer.from(JSON.stringify(claim)))}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signInput);
  const signature = base64url(signer.sign(privateKey));
  const jwt = `${signInput}.${signature}`;

  return new Promise((resolve, reject) => {
    const postData = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
    const req = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.access_token) {
            cachedToken = { token: parsed.access_token, expiresAt: now + (parsed.expires_in || 3600) };
            resolve(parsed.access_token);
          } else {
            reject(new Error("Failed token: " + body));
          }
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function fetchValues(range) {
  const token = await getGoogleAccessToken();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  return new Promise((resolve, reject) => {
    https.get(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed.values || []);
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function parseSheetDate(rawDate) {
  if (!rawDate) return null;
  const trimmed = rawDate.trim();
  if (!trimmed || trimmed.toLowerCase().includes("कुल") || trimmed.toLowerCase().includes("total")) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.substring(0, 10);

  const parts = trimmed.split(/[/ -]/);
  if (parts.length >= 3) {
    let p1 = parseInt(parts[0], 10);
    let p2 = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    if (isNaN(year)) return null;
    if (year < 100) year += 2000;
    let day = p1;
    let month = p2;
    if (p2 > 12 && p1 <= 12) { day = p2; month = p1; }
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return null;
}

function parseSheetDateTime(raw) {
  if (!raw) return new Date().toISOString();
  const dateOnly = parseSheetDate(raw);
  if (!dateOnly) return new Date().toISOString();
  const match = raw.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    return `${dateOnly}T${String(match[1]).padStart(2, '0')}:${String(match[2]).padStart(2, '0')}:00.000Z`;
  }
  return `${dateOnly}T00:00:00.000Z`;
}

function parseQty(raw) {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === 'number') return Math.round(raw);
  const n = parseInt(String(raw).replace(/,/g, '').trim(), 10);
  return isNaN(n) ? 0 : n;
}

async function runSync() {
  console.log("=== STARTING SYNC TO SUPABASE ===");
  const startTime = Date.now();

  try {
    // 1. SKU Catalog
    console.log("\n[1/4] Syncing SKU-Cat-Name...");
    const skuRows = await fetchValues("'SKU-Cat-Name'!A2:H1200");
    const products = [];
    for (let i = 1; i < skuRows.length; i++) {
      const row = skuRows[i];
      const sku = (row[0] || '').trim();
      if (!sku || sku.includes("कुल") || sku.toLowerCase().includes("total")) continue;
      products.push({
        sku_code: sku,
        old_sku_code: (row[1] || '').trim() || null,
        product_name: (row[2] || '').trim() || null,
        sourcing: (row[3] || '').trim() || null,
        brand: (row[4] || '').trim() || null,
        category: (row[5] || '').trim() || null,
        required_qty: parseQty(row[6]),
        updated_at: new Date().toISOString()
      });
    }
    if (products.length > 0) {
      const { error } = await supabase.from('products').upsert(products, { onConflict: 'sku_code' });
      if (error) console.error("Error upserting products:", error.message);
      else console.log(`✓ Upserted ${products.length} products from SKU-Cat-Name`);
    }

    // 2. Stock Sheet
    console.log("\n[2/4] Syncing Stock Sheet...");
    const stockRows = await fetchValues("'Stock Sheet'!A2:EE600");
    const headerRow = stockRows[0];
    const dateColumns = [];
    for (let c = 5; c < headerRow.length; c++) {
      const val = headerRow[c];
      if (!val || val.includes("कुल") || val.toLowerCase().includes("total")) continue;
      const parsedDate = parseSheetDate(val);
      if (parsedDate) dateColumns.push({ colIndex: c, dateStr: parsedDate });
    }
    console.log(`Found ${dateColumns.length} date columns (${dateColumns[0]?.dateStr} to ${dateColumns[dateColumns.length - 1]?.dateStr})`);

    const stockItems = [];
    const stockProducts = [];
    for (let r = 2; r < stockRows.length; r++) {
      const row = stockRows[r];
      const sku = (row[4] || '').trim();
      if (!sku || sku.includes("कुल") || sku.toLowerCase().includes("total")) continue;

      stockProducts.push({
        sku_code: sku,
        product_name: (row[2] || '').trim() || null,
        brand: (row[1] || '').trim() || null,
        category: (row[3] || '').trim() || null,
        sourcing: (row[0] || '').trim() || null,
        updated_at: new Date().toISOString()
      });

      for (const dc of dateColumns) {
        stockItems.push({
          sku_code: sku,
          date: dc.dateStr,
          quantity: parseQty(row[dc.colIndex])
        });
      }
    }

    if (stockProducts.length > 0) {
      await supabase.from('products').upsert(stockProducts, { onConflict: 'sku_code' });
    }

    console.log(`Upserting ${stockItems.length} daily stock points in batches...`);
    const BATCH_SIZE = 1000;
    for (let i = 0; i < stockItems.length; i += BATCH_SIZE) {
      const batch = stockItems.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('daily_stock').upsert(batch, { onConflict: 'sku_code,date' });
      if (error) console.error(`Error on batch ${i}:`, error.message);
    }
    console.log(`✓ Daily stock synced successfully!`);

    await supabase.from('sync_metadata').upsert({
      sheet_name: 'Stock Sheet',
      last_synced_at: new Date().toISOString(),
      last_synced_date_column: dateColumns[dateColumns.length - 1]?.dateStr,
      total_rows_synced: stockItems.length,
      total_date_columns: dateColumns.length,
      status: 'idle',
      updated_at: new Date().toISOString()
    }, { onConflict: 'sheet_name' });

    // 3. Inward Data
    console.log("\n[3/4] Syncing Inward Data...");
    const { data: inMeta } = await supabase.from('sync_metadata').select('last_synced_row').eq('sheet_name', 'Inward Data').single();
    const inStartRow = (inMeta?.last_synced_row || 2) + 1;
    const inwardRows = await fetchValues(`'Inward Data'!A${inStartRow}:E${inStartRow + 5000}`);
    
    if (inwardRows && inwardRows.length > 0) {
      const inRecords = [];
      let cur = inStartRow;
      for (const r of inwardRows) {
        if (r[0] && r[1]) {
          inRecords.push({
            sku_code: String(r[1]).trim(),
            date: parseSheetDateTime(r[0]),
            quantity: parseQty(r[2]),
            remark: r[3] ? String(r[3]).trim() : null,
            reference_no: r[4] ? String(r[4]).trim() : null,
            sheet_row_number: cur
          });
        }
        cur++;
      }
      for (let i = 0; i < inRecords.length; i += BATCH_SIZE) {
        await supabase.from('inward_transactions').insert(inRecords.slice(i, i + BATCH_SIZE));
      }
      await supabase.from('sync_metadata').upsert({
        sheet_name: 'Inward Data',
        last_synced_at: new Date().toISOString(),
        last_synced_row: inStartRow + inwardRows.length - 1,
        total_rows_synced: inRecords.length,
        status: 'idle',
        updated_at: new Date().toISOString()
      }, { onConflict: 'sheet_name' });
      console.log(`✓ Synced ${inRecords.length} inward records`);
    } else {
      console.log("Inward data up to date.");
    }

    // 4. Outward Data
    console.log("\n[4/4] Syncing OutWard Data...");
    const { data: outMeta } = await supabase.from('sync_metadata').select('last_synced_row').eq('sheet_name', 'OutWard Data').single();
    const outStartRow = (outMeta?.last_synced_row || 2) + 1;
    // Sync first 10,000 or new rows
    const outwardRows = await fetchValues(`'OutWard Data'!A${outStartRow}:D${outStartRow + 20000}`);
    if (outwardRows && outwardRows.length > 0) {
      const outRecords = [];
      let cur = outStartRow;
      for (const r of outwardRows) {
        if (r[0] && r[1]) {
          outRecords.push({
            sku_code: String(r[1]).trim(),
            date: parseSheetDateTime(r[0]),
            quantity: parseQty(r[2]),
            gatepass_no: r[3] ? String(r[3]).trim() : null,
            sheet_row_number: cur
          });
        }
        cur++;
      }
      for (let i = 0; i < outRecords.length; i += BATCH_SIZE) {
        await supabase.from('outward_transactions').insert(outRecords.slice(i, i + BATCH_SIZE));
      }
      await supabase.from('sync_metadata').upsert({
        sheet_name: 'OutWard Data',
        last_synced_at: new Date().toISOString(),
        last_synced_row: outStartRow + outwardRows.length - 1,
        total_rows_synced: outRecords.length,
        status: 'idle',
        updated_at: new Date().toISOString()
      }, { onConflict: 'sheet_name' });
      console.log(`✓ Synced ${outRecords.length} outward records`);
    } else {
      console.log("Outward data up to date.");
    }

    console.log(`\n🎉 SYNC COMPLETED in ${((Date.now() - startTime) / 1000).toFixed(1)}s!`);
  } catch (err) {
    console.error("Sync error:", err);
  }
}

runSync();
