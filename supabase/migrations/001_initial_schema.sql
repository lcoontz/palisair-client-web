-- Palisair Auditor Web: Initial Schema
-- Run on Supabase project: fmvdtzyaqhdolaretvlp

-- ============================================
-- ROOMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rooms (
  slug TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  bq_table_id TEXT NOT NULL,
  dataset_id TEXT NOT NULL DEFAULT 'palisair_contents',
  item_count INTEGER NOT NULL DEFAULT 0,
  total_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  priced_count INTEGER NOT NULL DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id TEXT NOT NULL,
  room_slug TEXT NOT NULL REFERENCES rooms(slug) ON DELETE CASCADE,

  -- Core fields
  item TEXT NOT NULL DEFAULT '',
  item_description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  brand TEXT,
  features TEXT,
  category TEXT,

  -- Pricing (stored as NUMERIC, not STRING)
  price NUMERIC(10, 2),
  shipping_cost NUMERIC(10, 2) DEFAULT 0,
  tax NUMERIC(10, 2) DEFAULT 0,
  total_cost NUMERIC(12, 2) DEFAULT 0,
  units_per_product INTEGER DEFAULT 1,
  original_msrp NUMERIC(10, 2),

  -- Links/Images
  purchase_link TEXT,
  cropped_image_url TEXT,
  images_found_in TEXT,
  product_name TEXT,

  -- Review fields
  review_action TEXT,
  review_note TEXT,
  target_price NUMERIC(10, 2),
  search_status TEXT,
  status TEXT,
  visual_match TEXT,
  internal_review_status TEXT,

  -- Sync tracking
  sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending_push', 'push_failed')),
  local_modified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(row_id, room_slug)
);

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  name TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SYNC LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction TEXT NOT NULL CHECK (direction IN ('bq_to_supabase', 'supabase_to_bq')),
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  items_inserted INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_pushed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_items_room_slug ON items(room_slug);
CREATE INDEX IF NOT EXISTS idx_items_review_action ON items(review_action);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_total_cost_desc ON items(total_cost DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_items_quantity_desc ON items(quantity DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_items_sync_pending ON items(sync_status) WHERE sync_status = 'pending_push';
CREATE INDEX IF NOT EXISTS idx_items_search ON items USING GIN (to_tsvector('english', COALESCE(item, '') || ' ' || COALESCE(brand, '') || ' ' || COALESCE(item_description, '')));
CREATE INDEX IF NOT EXISTS idx_sync_log_started ON sync_log(started_at DESC);

-- ============================================
-- AUTO-UPDATE TRIGGER
-- Sets updated_at, local_modified_at, and sync_status on item edit
-- Skips if the update is from the sync process (detected by sync_status being set to 'synced')
-- ============================================
CREATE OR REPLACE FUNCTION handle_item_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- If the sync process is setting sync_status to 'synced', don't override it
  IF NEW.sync_status = 'synced' AND OLD.sync_status != NEW.sync_status THEN
    RETURN NEW;
  END IF;

  -- For user edits: mark as pending_push
  IF OLD.sync_status IS DISTINCT FROM 'pending_push' OR
     OLD.item IS DISTINCT FROM NEW.item OR
     OLD.quantity IS DISTINCT FROM NEW.quantity OR
     OLD.brand IS DISTINCT FROM NEW.brand OR
     OLD.features IS DISTINCT FROM NEW.features OR
     OLD.item_description IS DISTINCT FROM NEW.item_description OR
     OLD.review_action IS DISTINCT FROM NEW.review_action OR
     OLD.review_note IS DISTINCT FROM NEW.review_note OR
     OLD.target_price IS DISTINCT FROM NEW.target_price OR
     OLD.purchase_link IS DISTINCT FROM NEW.purchase_link OR
     OLD.price IS DISTINCT FROM NEW.price OR
     OLD.shipping_cost IS DISTINCT FROM NEW.shipping_cost OR
     OLD.tax IS DISTINCT FROM NEW.tax OR
     OLD.total_cost IS DISTINCT FROM NEW.total_cost THEN
    NEW.local_modified_at = NOW();
    NEW.sync_status = 'pending_push';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_item_update
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION handle_item_update();

-- ============================================
-- RLS: Disabled for now (unauthenticated access)
-- ============================================
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- Allow all access (no auth)
CREATE POLICY "Allow all access to rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to items" ON items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sync_log" ON sync_log FOR ALL USING (true) WITH CHECK (true);
