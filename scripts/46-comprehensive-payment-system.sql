-- Comprehensive Payment System with Escrow
-- Supports 11 payment gateways with unified transaction management

-- Enhanced payment gateways table with more configuration options
CREATE TABLE IF NOT EXISTS payment_gateway_settings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('fiat', 'crypto')),
    is_enabled BOOLEAN DEFAULT false,
    fee_percentage DECIMAL(5,2) DEFAULT 0.00,
    fee_fixed DECIMAL(10,2) DEFAULT 0.00,
    min_amount DECIMAL(10,2) DEFAULT 0.00,
    max_amount DECIMAL(10,2) DEFAULT 999999.99,
    supported_currencies TEXT[], -- JSON array of supported currencies
    supported_countries TEXT[], -- JSON array of supported country codes
    api_credentials JSONB, -- Encrypted API keys and settings
    webhook_url VARCHAR(255),
    is_sandbox BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Multi-currency support table
CREATE TABLE IF NOT EXISTS currencies (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL, -- USD, BDT, EUR, etc.
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    exchange_rate DECIMAL(15,6) DEFAULT 1.00, -- Rate to USD
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced transactions table with escrow support
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) UNIQUE NOT NULL, -- Our internal transaction ID
    external_transaction_id VARCHAR(255), -- Gateway's transaction ID
    user_id INTEGER REFERENCES users(id),
    seller_id INTEGER REFERENCES users(id),
    job_id INTEGER REFERENCES jobs(id),
    payment_gateway_id INTEGER REFERENCES payment_gateway_settings(id),
    
    -- Amount details
    amount DECIMAL(10,2) NOT NULL,
    currency_id INTEGER REFERENCES currencies(id),
    gateway_fee DECIMAL(10,2) DEFAULT 0.00,
    platform_fee DECIMAL(10,2) DEFAULT 0.00,
    seller_amount DECIMAL(10,2) NOT NULL, -- Amount seller will receive
    
    -- Transaction status and escrow
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed', 'cancelled')),
    escrow_status VARCHAR(20) DEFAULT 'held' CHECK (escrow_status IN ('held', 'released', 'refunded', 'disputed')),
    escrow_release_date TIMESTAMP,
    auto_release_days INTEGER DEFAULT 7,
    
    -- Payment details (no sensitive data)
    payment_method VARCHAR(50), -- card, bank_transfer, crypto, etc.
    payment_reference VARCHAR(255), -- Gateway reference
    payment_url VARCHAR(500), -- For crypto payments or redirects
    qr_code_data TEXT, -- For crypto QR codes
    
    -- Metadata
    metadata JSONB, -- Additional gateway-specific data
    webhook_data JSONB, -- Webhook response data
    failure_reason TEXT,
    refund_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    expires_at TIMESTAMP
);

-- Escrow management table
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id),
    buyer_id INTEGER REFERENCES users(id),
    seller_id INTEGER REFERENCES users(id),
    job_id INTEGER REFERENCES jobs(id),
    
    amount DECIMAL(10,2) NOT NULL,
    currency_id INTEGER REFERENCES currencies(id),
    
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'released', 'refunded', 'disputed')),
    release_condition VARCHAR(50) DEFAULT 'job_completion', -- job_completion, manual, time_based
    
    -- Release conditions
    auto_release_date TIMESTAMP,
    requires_buyer_approval BOOLEAN DEFAULT false,
    requires_admin_approval BOOLEAN DEFAULT false,
    
    -- Dispute handling
    dispute_reason TEXT,
    dispute_created_at TIMESTAMP,
    dispute_resolved_at TIMESTAMP,
    dispute_resolution TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP
);

-- Webhook events logging
CREATE TABLE IF NOT EXISTS webhook_events (
    id SERIAL PRIMARY KEY,
    payment_gateway_id INTEGER REFERENCES payment_gateway_settings(id),
    transaction_id INTEGER REFERENCES transactions(id),
    
    event_type VARCHAR(50) NOT NULL, -- payment.completed, payment.failed, etc.
    event_id VARCHAR(255), -- Gateway's event ID
    
    payload JSONB NOT NULL, -- Full webhook payload
    headers JSONB, -- Request headers
    
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment history for users
CREATE TABLE IF NOT EXISTS user_payment_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    transaction_id INTEGER REFERENCES transactions(id),
    
    type VARCHAR(20) NOT NULL CHECK (type IN ('payment', 'refund', 'payout', 'fee')),
    amount DECIMAL(10,2) NOT NULL,
    currency_id INTEGER REFERENCES currencies(id),
    
    description TEXT,
    reference_id VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Country-specific payment gateway availability
CREATE TABLE IF NOT EXISTS gateway_country_availability (
    id SERIAL PRIMARY KEY,
    payment_gateway_id INTEGER REFERENCES payment_gateway_settings(id),
    country_code VARCHAR(2) NOT NULL, -- ISO country codes
    is_available BOOLEAN DEFAULT true,
    restrictions JSONB, -- Any specific restrictions
    
    UNIQUE(payment_gateway_id, country_code)
);

-- Insert default currencies
INSERT INTO currencies (code, name, symbol, exchange_rate) VALUES
('USD', 'US Dollar', '$', 1.00),
('BDT', 'Bangladeshi Taka', '৳', 110.00),
('EUR', 'Euro', '€', 0.85),
('GBP', 'British Pound', '£', 0.75),
('BTC', 'Bitcoin', '₿', 45000.00),
('ETH', 'Ethereum', 'Ξ', 3000.00)
ON CONFLICT (code) DO NOTHING;

-- Insert payment gateways
INSERT INTO payment_gateway_settings (name, display_name, type, supported_currencies, supported_countries) VALUES
('portwallet', 'PortWallet', 'fiat', '["BDT", "USD"]', '["BD"]'),
('aamarpay', 'AamarPay', 'fiat', '["BDT", "USD"]', '["BD"]'),
('payoneer', 'Payoneer', 'fiat', '["USD", "EUR", "GBP"]', '["US", "EU", "GB"]'),
('2checkout', '2Checkout', 'fiat', '["USD", "EUR", "GBP"]', '["US", "EU", "GB"]'),
('coingate', 'CoinGate', 'crypto', '["BTC", "ETH", "USD", "EUR"]', '["US", "EU", "GB"]'),
('nowpayments', 'NOWPayments', 'crypto', '["BTC", "ETH", "USD", "EUR"]', '["US", "EU", "GB"]'),
('coinpayments', 'CoinPayments', 'crypto', '["BTC", "ETH", "USD", "EUR"]', '["US", "EU", "GB"]'),
('utorg', 'Utorg', 'crypto', '["BTC", "ETH", "USD", "EUR"]', '["US", "EU", "GB"]'),
('coinbase_commerce', 'Coinbase Commerce', 'crypto', '["BTC", "ETH", "USD", "EUR"]', '["US", "EU", "GB"]'),
('payeer', 'Payeer', 'fiat', '["USD", "EUR", "RUB"]', '["US", "EU", "RU"]'),
('skrill', 'Skrill', 'fiat', '["USD", "EUR", "GBP"]', '["US", "EU", "GB"]')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_escrow_status ON transactions(escrow_status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_status ON escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_user_payment_history_user_id ON user_payment_history(user_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_gateway_settings_updated_at BEFORE UPDATE ON payment_gateway_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_currencies_updated_at BEFORE UPDATE ON currencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_escrow_transactions_updated_at BEFORE UPDATE ON escrow_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
