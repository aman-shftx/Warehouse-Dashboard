# 🏭 Warehouse Inventory & Sourcing Dashboard

A fast, read-only warehouse inventory and sourcing mirror built with **Next.js 14 (App Router)**, **Supabase (PostgreSQL)**, and **Google Sheets API**.

---

## 🌟 Key Architecture & Flow

```text
Google Sheets (Source of Truth)
   │
   ├─ Stock Sheet (~332 SKUs × 80+ daily dates)
   ├─ SKU-Cat-Name (Catalog & Old/New SKU Mapping)
   ├─ Inward Data (Transactional log)
   └─ OutWard Data (Transactional log)
         │
         ▼ (Background Sync: Vercel Cron 15m / Manual Button)
Supabase (Mirror Database)
   │
   ├─ products
   ├─ daily_stock (Normalized time-series)
   ├─ inward_transactions
   ├─ outward_transactions
   └─ sync_metadata
         │
         ▼ (Optimized SQL queries, views & sub-second latency)
Next.js 14 Dashboard (Hosted on Vercel)
   │
   ├─ Overview: High-level KPI cards, warehouse trend chart, quick search
   ├─ Inventory: Instant search, multi-filters (Category, Sourcing, Stock level), sorting, pagination
   ├─ Analytics: Top 50 SKUs by Daily Run Rate (DRR 7D), category breakdown
   ├─ Alerts: Sourcing deficit schedule, out of stock, reorder required
   └─ SKU Details: Historical stock trends, recent inward shipments & outward dispatches
```

---

## 🚀 Getting Started

### 1. Database Setup in Supabase
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor** on the left menu.
3. Click **+ New Query**.
4. Paste the content of [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql).
5. Click **Run**.

### 2. Environment Configuration
Create a `.env.local` file with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account-email
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Sync Secret
SYNC_SECRET=your-sync-secret
```

### 3. Run Locally
```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the dashboard.

### 4. Trigger Sync
- **Via CLI**:
  ```bash
  npm run sync
  ```
- **Via Dashboard**: Click the **"Sync Sheet Now"** button in the header.
- **Via API**:
  ```bash
  curl http://localhost:3000/api/sync?secret=your-sync-secret
  ```
- **Automated**: Handled automatically every 15 minutes by `vercel.json` cron job.
