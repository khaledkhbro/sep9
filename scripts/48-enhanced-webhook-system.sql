-- Enhanced webhook system with monitoring and retry capabilities

-- Add additional columns to webhook_events table
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS final_failure_at TIMESTAMP;

-- Create webhook monitoring view
CREATE OR REPLACE VIEW webhook_health_summary AS
SELECT 
    pg.name as gateway_name,
    pg.display_name,
    COUNT(*) as total_webhooks,
    COUNT(*) FILTER (WHERE we.processed = true) as successful_webhooks,
    COUNT(*) FILTER (WHERE we.processed = false) as failed_webhooks,
    ROUND(
        (COUNT(*) FILTER (WHERE we.processed = true)::decimal / COUNT(*)) * 100, 2
    ) as success_rate,
    AVG(we.processing_time_ms) as avg_processing_time_ms,
    MAX(we.created_at) as last_webhook_at
FROM webhook_events we
JOIN payment_gateways pg ON we.payment_gateway_id = pg.id
WHERE we.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY pg.id, pg.name, pg.display_name;

-- Create function to clean old webhook events
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete webhook events older than 30 days
    DELETE FROM webhook_events 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better webhook query performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_gateway_created ON webhook_events(payment_gateway_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_created ON webhook_events(processed, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_retry_count ON webhook_events(retry_count) WHERE retry_count > 0;

-- Create webhook failure alerts table
CREATE TABLE IF NOT EXISTS webhook_failure_alerts (
    id SERIAL PRIMARY KEY,
    gateway_name VARCHAR(50) NOT NULL,
    failure_count INTEGER NOT NULL,
    time_window_minutes INTEGER NOT NULL,
    alert_threshold INTEGER NOT NULL,
    last_alert_sent TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default failure alert configurations
INSERT INTO webhook_failure_alerts (gateway_name, failure_count, time_window_minutes, alert_threshold) VALUES
('portwallet', 0, 60, 5),
('aamarpay', 0, 60, 5),
('coingate', 0, 60, 3),
('nowpayments', 0, 60, 3),
('2checkout', 0, 60, 5),
('coinbase_commerce', 0, 60, 3)
ON CONFLICT DO NOTHING;
