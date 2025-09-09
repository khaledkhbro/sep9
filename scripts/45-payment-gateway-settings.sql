-- Payment Gateway Settings System
-- This script creates tables for managing payment gateway configurations

-- Payment gateways configuration table
CREATE TABLE IF NOT EXISTS payment_gateways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'crypto', 'fiat', 'wallet', 'bank'
    logo_url TEXT,
    is_enabled BOOLEAN DEFAULT false,
    is_deposit_enabled BOOLEAN DEFAULT false,
    is_withdrawal_enabled BOOLEAN DEFAULT false,
    deposit_fee_percentage DECIMAL(5,2) DEFAULT 0,
    deposit_fee_fixed DECIMAL(10,2) DEFAULT 0,
    withdrawal_fee_percentage DECIMAL(5,2) DEFAULT 0,
    withdrawal_fee_fixed DECIMAL(10,2) DEFAULT 0,
    min_deposit_amount DECIMAL(10,2) DEFAULT 1.00,
    max_deposit_amount DECIMAL(10,2),
    min_withdrawal_amount DECIMAL(10,2) DEFAULT 1.00,
    max_withdrawal_amount DECIMAL(10,2),
    processing_time_deposit VARCHAR(100),
    processing_time_withdrawal VARCHAR(100),
    supported_currencies TEXT[], -- JSON array of supported currencies
    api_credentials JSONB, -- Store encrypted API keys and settings
    webhook_url TEXT,
    is_test_mode BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default payment gateways
INSERT INTO payment_gateways (name, display_name, type, logo_url, processing_time_deposit, processing_time_withdrawal, supported_currencies) VALUES
('ssl_commerce', 'SSL Commerce', 'fiat', '/payment-logos/ssl-commerce.png', 'Instant', '1-3 business days', '["USD", "BDT"]'),
('port_wallet', 'Port Wallet', 'wallet', '/payment-logos/port-wallet.png', 'Instant', 'Instant', '["USD"]'),
('aamar_pay', 'Aamar Pay', 'fiat', '/payment-logos/aamar-pay.png', 'Instant', '1-2 business days', '["USD", "BDT"]'),
('paypal', 'PayPal', 'fiat', '/payment-logos/paypal.png', 'Instant', '1-2 business days', '["USD", "EUR", "GBP"]'),
('stripe', 'Stripe', 'fiat', '/payment-logos/stripe.png', 'Instant', '2-7 business days', '["USD", "EUR", "GBP"]'),
('payoneer', 'Payoneer', 'fiat', '/payment-logos/payoneer.png', '1-2 hours', '1-3 business days', '["USD", "EUR"]'),
('2checkout', '2Checkout', 'fiat', '/payment-logos/2checkout.png', 'Instant', '1-3 business days', '["USD", "EUR"]'),
('coingate', 'Coingate', 'crypto', '/payment-logos/coingate.png', '10-60 minutes', '10-60 minutes', '["BTC", "ETH", "LTC", "USD"]'),
('now_payments', 'Now Payments', 'crypto', '/payment-logos/now-payments.png', '10-60 minutes', '10-60 minutes', '["BTC", "ETH", "USDT"]'),
('coin_payments', 'Coin Payments', 'crypto', '/payment-logos/coin-payments.png', '10-60 minutes', '10-60 minutes', '["BTC", "ETH", "LTC"]'),
('utorg', 'Utorg', 'crypto', '/payment-logos/utorg.png', '5-30 minutes', '5-30 minutes', '["BTC", "ETH", "USD"]'),
('binance_pay', 'Binance Pay', 'crypto', '/payment-logos/binance-pay.png', 'Instant', 'Instant', '["BTC", "ETH", "USDT", "BNB"]'),
('coinbase_commerce', 'Coinbase Commerce', 'crypto', '/payment-logos/coinbase-commerce.png', '10-60 minutes', '10-60 minutes', '["BTC", "ETH", "USDC"]'),
('payeer', 'Payeer', 'wallet', '/payment-logos/payeer.png', 'Instant', 'Instant', '["USD", "EUR", "RUB"]'),
('skrill', 'Skrill', 'fiat', '/payment-logos/skrill.png', 'Instant', '1-3 business days', '["USD", "EUR", "GBP"]')
ON CONFLICT (name) DO NOTHING;

-- Payment gateway transaction logs
CREATE TABLE IF NOT EXISTS payment_gateway_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway_name VARCHAR(100) NOT NULL REFERENCES payment_gateways(name),
    user_id UUID NOT NULL REFERENCES users(id),
    wallet_transaction_id UUID REFERENCES wallet_transactions(id),
    transaction_type VARCHAR(20) NOT NULL, -- 'deposit', 'withdrawal'
    amount DECIMAL(10,2) NOT NULL,
    fee_amount DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    gateway_transaction_id TEXT, -- External transaction ID from gateway
    gateway_status VARCHAR(50), -- Gateway-specific status
    gateway_response JSONB, -- Full gateway response
    webhook_data JSONB, -- Webhook payload data
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_gateways_enabled ON payment_gateways(is_enabled);
CREATE INDEX IF NOT EXISTS idx_payment_gateways_type ON payment_gateways(type);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_transactions_user ON payment_gateway_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_transactions_gateway ON payment_gateway_transactions(gateway_name);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_transactions_status ON payment_gateway_transactions(status);

-- Update trigger for payment_gateways
CREATE OR REPLACE FUNCTION update_payment_gateway_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_gateways_updated_at
    BEFORE UPDATE ON payment_gateways
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_gateway_updated_at();

-- Update trigger for payment_gateway_transactions
CREATE TRIGGER update_payment_gateway_transactions_updated_at
    BEFORE UPDATE ON payment_gateway_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_gateway_updated_at();
