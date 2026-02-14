-- Client-specific overview stats function
-- Only counts items with review_action IN ('final', 'client review')
CREATE OR REPLACE FUNCTION get_client_overview_stats(
  p_category TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  room_slug TEXT,
  display_name TEXT,
  item_count BIGINT,
  priced_count BIGINT,
  total_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.room_slug,
    r.display_name,
    COUNT(*)::BIGINT AS item_count,
    COUNT(CASE WHEN i.total_cost IS NOT NULL AND i.total_cost > 0 THEN 1 END)::BIGINT AS priced_count,
    COALESCE(SUM(i.total_cost), 0)::NUMERIC AS total_value
  FROM items i
  JOIN rooms r ON r.slug = i.room_slug
  WHERE
    i.review_action ILIKE ANY(
      CASE
        WHEN p_status IS NOT NULL THEN ARRAY[p_status]
        ELSE ARRAY['final', 'client review']
      END
    )
    AND (p_category IS NULL OR i.category = p_category)
  GROUP BY i.room_slug, r.display_name
  ORDER BY r.display_name;
END;
$$ LANGUAGE plpgsql;
