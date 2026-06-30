-- Hotfix: reduzir timeout na página /farm
-- Rode no Supabase SQL Editor.
-- Usa CONCURRENTLY para evitar lock pesado, mas execute fora de transação.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tbh_stage_drop_items_item_key
ON public.tbh_stage_drop_items (item_key);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tbh_stage_drop_items_stage_key
ON public.tbh_stage_drop_items (stage_key);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tbh_stage_drop_items_grade
ON public.tbh_stage_drop_items (grade);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tbh_stage_drop_items_source_type
ON public.tbh_stage_drop_items (source_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tbh_stage_drop_items_drop_key
ON public.tbh_stage_drop_items (drop_key);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tbh_stage_drop_items_stage_item
ON public.tbh_stage_drop_items (stage_key, item_key);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tbh_market_prices_item_key
ON public.tbh_market_prices (item_key);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tbh_market_prices_success
ON public.tbh_market_prices (success);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tbh_market_prices_lowest_success
ON public.tbh_market_prices (lowest_price_brl DESC)
WHERE success = true AND lowest_price_brl IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tbh_market_prices_updated_at
ON public.tbh_market_prices (updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tbh_market_item_map_item_key
ON public.tbh_market_item_map (item_key);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tbh_market_item_map_enabled
ON public.tbh_market_item_map (enabled);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tbh_market_item_map_hash
ON public.tbh_market_item_map (market_hash_name);

ANALYZE public.tbh_stage_drop_items;
ANALYZE public.tbh_market_prices;
ANALYZE public.tbh_market_item_map;
