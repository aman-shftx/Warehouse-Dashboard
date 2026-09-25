-- 001_initial_schema.sql
-- Warehouse Inventory Dashboard Initial Schema

-- Enable pg_trgm for fast text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Products Master Table
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    sku_code TEXT NOT NULL UNIQUE,
    old_sku_code TEXT,
    product_name TEXT,
    brand TEXT,
    category TEXT,
    sourcing TEXT, -- ORIGINAL, MARKET, FACTORY
    required_qty INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku_code);
CREATE INDEX IF NOT EXISTS idx_products_old_sku ON products(old_sku_code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_sourcing ON products(sourcing);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(product_name gin_trgm_ops);

-- 2. Daily Stock Table (Normalized from wide Stock Sheet)
CREATE TABLE IF NOT EXISTS daily_stock (
    id BIGSERIAL PRIMARY KEY,
    sku_code TEXT NOT NULL,
    date DATE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sku_code, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_stock_sku_date ON daily_stock(sku_code, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stock_date ON daily_stock(date DESC);

-- 3. Inward Transactions Table
CREATE TABLE IF NOT EXISTS inward_transactions (
    id BIGSERIAL PRIMARY KEY,
    sku_code TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    remark TEXT,
    reference_no TEXT,
    sheet_row_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inward_sku ON inward_transactions(sku_code);
CREATE INDEX IF NOT EXISTS idx_inward_date ON inward_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_inward_sku_date ON inward_transactions(sku_code, date DESC);

-- 4. Outward Transactions Table
CREATE TABLE IF NOT EXISTS outward_transactions (
    id BIGSERIAL PRIMARY KEY,
    sku_code TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    gatepass_no TEXT,
    sheet_row_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outward_sku ON outward_transactions(sku_code);
CREATE INDEX IF NOT EXISTS idx_outward_date ON outward_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_outward_sku_date ON outward_transactions(sku_code, date DESC);

-- 5. Sync Metadata
CREATE TABLE IF NOT EXISTS sync_metadata (
    id BIGSERIAL PRIMARY KEY,
    sheet_name TEXT NOT NULL UNIQUE,
    last_synced_at TIMESTAMPTZ,
    last_synced_date_column TEXT,
    last_synced_row INTEGER,
    total_rows_synced INTEGER DEFAULT 0,
    total_date_columns INTEGER DEFAULT 0,
    status TEXT DEFAULT 'idle',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed sync_metadata rows
INSERT INTO sync_metadata (sheet_name, status) 
VALUES 
    ('Stock Sheet', 'idle'),
    ('SKU-Cat-Name', 'idle'),
    ('Inward Data', 'idle'),
    ('OutWard Data', 'idle')
ON CONFLICT (sheet_name) DO NOTHING;

-- 6. Views
-- View: Current Stock (latest date's stock for each product)
CREATE OR REPLACE VIEW v_current_stock AS
SELECT DISTINCT ON (p.sku_code)
    p.sku_code,
    p.old_sku_code,
    p.product_name,
    p.brand,
    p.category,
    p.sourcing,
    p.required_qty,
    COALESCE(ds.date, CURRENT_DATE) AS latest_date,
    COALESCE(ds.quantity, 0) AS current_stock
FROM products p
LEFT JOIN daily_stock ds ON ds.sku_code = p.sku_code
ORDER BY p.sku_code, ds.date DESC NULLS LAST;

-- View: 7-Day DRR (Daily Run Rate calculated from outward)
CREATE OR REPLACE VIEW v_daily_run_rate AS
SELECT 
    p.sku_code,
    p.product_name,
    p.brand,
    p.category,
    p.sourcing,
    p.required_qty,
    COALESCE(cs.current_stock, 0) AS current_stock,
    COALESCE(ROUND(SUM(ot.quantity)::NUMERIC / 7.0, 2), 0) AS drr_7d,
    COALESCE(SUM(ot.quantity), 0) AS outward_7d
FROM products p
LEFT JOIN v_current_stock cs ON cs.sku_code = p.sku_code
LEFT JOIN outward_transactions ot 
    ON (ot.sku_code = p.sku_code OR ot.sku_code = p.old_sku_code)
    AND ot.date >= (NOW() - INTERVAL '7 days')
GROUP BY p.sku_code, p.product_name, p.brand, p.category, p.sourcing, p.required_qty, cs.current_stock;

-- View: Daily Inward Summary
CREATE OR REPLACE VIEW v_daily_inward_summary AS
SELECT 
    sku_code,
    date::DATE AS date,
    SUM(quantity) AS total_inward
FROM inward_transactions
GROUP BY sku_code, date::DATE;

-- View: Daily Outward Summary
CREATE OR REPLACE VIEW v_daily_outward_summary AS
SELECT 
    sku_code,
    date::DATE AS date,
    SUM(quantity) AS total_outward
FROM outward_transactions
GROUP BY sku_code, date::DATE;

-- 7. Security (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE inward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE outward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_metadata ENABLE ROW LEVEL SECURITY;

-- Allow read-only public access
CREATE POLICY "Allow public read-only access on products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access on daily_stock" ON daily_stock FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access on inward_transactions" ON inward_transactions FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access on outward_transactions" ON outward_transactions FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access on sync_metadata" ON sync_metadata FOR SELECT USING (true);
