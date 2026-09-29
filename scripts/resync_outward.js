const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
const env = {};
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
      env[key] = val;
    }
  });
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function base64url(buf) {
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getGoogleAccessToken() {
  const clientEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n');
  const now = Math.floor(Date.now() / 1000);
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
  const jwt = `${signInput}.${base64url(signer.sign(privateKey))}`;

  return new Promise((resolve, reject) => {
    const postData = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
    const req = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(b);
          if (parsed.access_token) resolve(parsed.access_token);
          else reject(new Error('Failed token: ' + b));
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
  const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;
  return new Promise((resolve, reject) => {
    https.get(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }, res => {
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
    const now = new Date();
    const candidateDate = new Date(year, month - 1, day);
    if (candidateDate > now && p1 <= 12 && p2 <= 12) {
      const swappedDate = new Date(year, p1 - 1, p2);
      if (swappedDate <= now) {
        month = p1;
        day = p2;
      }
    }
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

async function run() {
  console.log("=== FULL RESYNC OF OUTWARD DATA FROM GOOGLE SHEETS ===");
  const outwardRows = await fetchValues("'OutWard Data'!A3:D25000");
  console.log(`Fetched ${outwardRows.length} rows from Google Sheet.`);

  const records = [];
  let cur = 3;
  for (const r of outwardRows) {
    if (r[0] && r[1]) {
      records.push({
        sku_code: String(r[1]).trim(),
        date: parseSheetDateTime(r[0]),
        quantity: parseQty(r[2]),
        gatepass_no: r[3] ? String(r[3]).trim() : null,
        sheet_row_number: cur
      });
    }
    cur++;
  }

  console.log(`Prepared ${records.length} outward records. Deleting old table rows in Supabase...`);
  // Delete all rows in outward_transactions
  const { error: delErr } = await supabase.from('outward_transactions').delete().gte('id', 0);
  if (delErr) {
    console.error("Delete error:", delErr);
    return;
  }
  console.log("✓ Existing outward_transactions cleared.");

  console.log(`Inserting ${records.length} records in batches of 1000...`);
  const BATCH_SIZE = 1000;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error: insErr } = await supabase.from('outward_transactions').insert(batch);
    if (insErr) {
      console.error(`Error on batch ${i}:`, insErr);
      return;
    }
    process.stdout.write(`  Inserted ${Math.min(i + BATCH_SIZE, records.length)}/${records.length}\r`);
  }
  console.log(`\n✓ All ${records.length} outward records inserted successfully!`);

  // Update sync metadata
  await supabase.from('sync_metadata').upsert({
    sheet_name: 'OutWard Data',
    last_synced_at: new Date().toISOString(),
    last_synced_row: cur - 1,
    total_rows_synced: records.length,
    status: 'idle',
    updated_at: new Date().toISOString()
  }, { onConflict: 'sheet_name' });

  console.log("Sync metadata updated.");

  // Verify target SKU CBL-USB2C-R-OP-F
  const target = 'CBL-USB2C-R-OP-F';
  let targetSbRows = [];
  let offset = 0;
  while (true) {
    const { data: page } = await supabase
      .from('outward_transactions')
      .select('date, quantity')
      .eq('sku_code', target)
      .range(offset, offset + 999);
    if (!page || page.length === 0) break;
    targetSbRows.push(...page);
    if (page.length < 1000) break;
    offset += 1000;
  }
  const sumTarget = targetSbRows.reduce((s, r) => s + r.quantity, 0);
  console.log(`Verification for ${target}: ${targetSbRows.length} rows, TOTAL SUM = ${sumTarget} (Expected 54,644)`);
}

run();
