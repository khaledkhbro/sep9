-- Complete database setup for Supabase-only implementation
-- Remove all Neon references and create comprehensive Supabase functions

-- Create all necessary RPC functions for complex queries
CREATE OR REPLACE FUNCTION get_payment_gateway_stats()
RETURNS TABLE (
  gateway_name TEXT,
  total_transactions BIGINT,
  total_volume NUMERIC,
  success_rate NUMERIC,
  avg_processing_seconds NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pgs.name as gateway_name,
    COUNT(pt.id) as total_transactions,
    COALESCE(SUM(pt.amount), 0) as total_volume,
    ROUND(
      (COUNT(CASE WHEN pt.status = 'completed' THEN 1 END) * 100.0 / NULLIF(COUNT(pt.id), 0)), 
      1
    ) as success_rate,
    AVG(EXTRACT(EPOCH FROM (pt.updated_at - pt.created_at))) as avg_processing_seconds
  FROM payment_gateway_settings pgs
  LEFT JOIN payment_transactions pt ON pgs.name = pt.gateway_name
  WHERE pt.created_at >= NOW() - INTERVAL '30 days' OR pt.id IS NULL
  GROUP BY pgs.name, pgs.display_name
  ORDER BY pgs.sort_order;
END;
$$ LANGUAGE plpgsql;

-- Function for earnings news with country filtering
CREATE OR REPLACE FUNCTION get_earnings_news_for_user(
  user_country TEXT DEFAULT NULL,
  offset_val INTEGER DEFAULT 0,
  limit_val INTEGER DEFAULT 5
)
RETURNS TABLE (
  id INTEGER,
  title TEXT,
  thumbnail TEXT,
  description TEXT,
  money NUMERIC,
  countries TEXT[],
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    en.id,
    en.title,
    en.thumbnail,
    en.description,
    en.money,
    en.countries,
    en.created_at
  FROM earnings_news en
  WHERE en.status = true
  AND (
    en.countries IS NULL 
    OR user_country IS NULL 
    OR user_country = ANY(en.countries)
  )
  ORDER BY en.created_at DESC
  LIMIT limit_val
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql;

-- Function for earnings news count
CREATE OR REPLACE FUNCTION get_earnings_news_count_for_user(
  user_country TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  total_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO total_count
  FROM earnings_news en
  WHERE en.status = true
  AND (
    en.countries IS NULL 
    OR user_country IS NULL 
    OR user_country = ANY(en.countries)
  );
  
  RETURN total_count;
END;
$$ LANGUAGE plpgsql;

-- Function for admin earnings news
CREATE OR REPLACE FUNCTION get_all_earnings_news_admin(
  offset_val INTEGER DEFAULT 0,
  limit_val INTEGER DEFAULT 10
)
RETURNS TABLE (
  id INTEGER,
  title TEXT,
  thumbnail TEXT,
  description TEXT,
  money NUMERIC,
  countries TEXT[],
  status BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    en.id,
    en.title,
    en.thumbnail,
    en.description,
    en.money,
    en.countries,
    en.status,
    en.created_at,
    en.updated_at
  FROM earnings_news en
  ORDER BY en.created_at DESC
  LIMIT limit_val
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql;

-- Function for admin earnings news count
CREATE OR REPLACE FUNCTION get_all_earnings_news_count_admin()
RETURNS INTEGER AS $$
DECLARE
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM earnings_news;
  RETURN total_count;
END;
$$ LANGUAGE plpgsql;
