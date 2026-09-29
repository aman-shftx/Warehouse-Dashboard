const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

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

function base64url(buf) { return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); }
async function getGoogleAccessToken() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n');
  const now = Math.floor(Date.now() / 1000);
  const s = base64url(Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" }))) + '.' + base64url(Buffer.from(JSON.stringify({
    iss: clientEmail, scope: "https://www.googleapis.com/auth/spreadsheets.readonly", aud: "https://oauth2.googleapis.com/token", exp: now + 3600, iat: now
  })));
  const signer = crypto.createSign('RSA-SHA256'); signer.update(s);
  const sig = base64url(signer.sign(privateKey));
  const postData = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${s}.${sig}`;
  return new Promise((resolve, reject) => {
    const req = https.request('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) } }, res => {
      let b = ''; res.on('data', c => b += c); res.on('end', () => resolve(JSON.parse(b).access_token));
    });
    req.write(postData); req.end();
  });
}

async function fetchValues(range) {
  const token = await getGoogleAccessToken();
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  return new Promise((resolve, reject) => {
    https.get(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent(range)}`, {
      headers: { Authorization: `Bearer ${token}` }
    }, res => {
      let b = ''; res.on('data', c => b += c); res.on('end', () => resolve(JSON.parse(b).values || []));
    }).on('error', reject);
  });
}

async function check() {
  const rows = await fetchValues("'OutWard Data'!A3055:D3065");
  rows.forEach((r, i) => console.log(3055 + i, r));
}

check().catch(console.error);
