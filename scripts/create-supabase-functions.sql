-- Create RPC functions for complex queries that were using Neon template literals

-- Function to get payment gateway stats
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

-- Function to execute raw SQL (for complex queries)
CREATE OR REPLACE FUNCTION execute_sql(query_text TEXT, query_params JSONB DEFAULT '[]'::jsonb)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- This is a simplified version - in production you'd want more security
  EXECUTE query_text INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
