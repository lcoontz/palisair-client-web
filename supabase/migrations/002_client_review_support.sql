-- Add client_feedback column for dedicated client feedback (separate from auditor's review_note)
ALTER TABLE items ADD COLUMN IF NOT EXISTS client_feedback TEXT;

-- Index for efficient client app queries (items visible to clients)
CREATE INDEX IF NOT EXISTS idx_items_client_visible
  ON items(review_action) WHERE review_action IN ('final', 'client review');

-- Composite index for room + review_action for client filtering
CREATE INDEX IF NOT EXISTS idx_items_room_review_action
  ON items(room_slug, review_action);
