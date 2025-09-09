-- Stored procedures and functions for payment system

-- Function to create a new transaction with escrow
CREATE OR REPLACE FUNCTION create_escrow_transaction(
    p_user_id INTEGER,
    p_seller_id INTEGER,
    p_job_id INTEGER,
    p_gateway_name VARCHAR(50),
    p_amount DECIMAL(10,2),
    p_currency_code VARCHAR(3),
    p_auto_release_days INTEGER DEFAULT 7
) RETURNS VARCHAR(100) AS $$
DECLARE
    v_transaction_id VARCHAR(100);
    v_gateway_id INTEGER;
    v_currency_id INTEGER;
    v_platform_fee DECIMAL(10,2);
    v_gateway_fee DECIMAL(10,2);
    v_seller_amount DECIMAL(10,2);
BEGIN
    -- Generate unique transaction ID
    v_transaction_id := 'TXN_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || FLOOR(RANDOM() * 1000);
    
    -- Get gateway and currency IDs
    SELECT id INTO v_gateway_id FROM payment_gateways WHERE name = p_gateway_name;
    SELECT id INTO v_currency_id FROM currencies WHERE code = p_currency_code;
    
    -- Calculate fees (5% platform fee + gateway fee)
    SELECT fee_percentage, fee_fixed INTO v_gateway_fee FROM payment_gateways WHERE id = v_gateway_id;
    v_platform_fee := p_amount * 0.05; -- 5% platform fee
    v_gateway_fee := (p_amount * v_gateway_fee / 100) + COALESCE((SELECT fee_fixed FROM payment_gateways WHERE id = v_gateway_id), 0);
    v_seller_amount := p_amount - v_platform_fee - v_gateway_fee;
    
    -- Create transaction
    INSERT INTO transactions (
        transaction_id, user_id, seller_id, job_id, payment_gateway_id,
        amount, currency_id, gateway_fee, platform_fee, seller_amount,
        auto_release_days, expires_at
    ) VALUES (
        v_transaction_id, p_user_id, p_seller_id, p_job_id, v_gateway_id,
        p_amount, v_currency_id, v_gateway_fee, v_platform_fee, v_seller_amount,
        p_auto_release_days, NOW() + INTERVAL '24 hours'
    );
    
    -- Create escrow entry
    INSERT INTO escrow_transactions (
        transaction_id, buyer_id, seller_id, job_id,
        amount, currency_id, auto_release_date
    ) VALUES (
        (SELECT id FROM transactions WHERE transaction_id = v_transaction_id),
        p_user_id, p_seller_id, p_job_id,
        p_amount, v_currency_id, NOW() + INTERVAL '1 day' * p_auto_release_days
    );
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to release escrow funds
CREATE OR REPLACE FUNCTION release_escrow_funds(
    p_transaction_id VARCHAR(100),
    p_release_reason VARCHAR(100) DEFAULT 'job_completion'
) RETURNS BOOLEAN AS $$
DECLARE
    v_transaction_record RECORD;
BEGIN
    -- Get transaction details
    SELECT t.*, e.id as escrow_id 
    INTO v_transaction_record
    FROM transactions t
    JOIN escrow_transactions e ON t.id = e.transaction_id
    WHERE t.transaction_id = p_transaction_id;
    
    -- Update transaction status
    UPDATE transactions 
    SET status = 'completed', 
        escrow_status = 'released',
        escrow_release_date = NOW(),
        completed_at = NOW()
    WHERE transaction_id = p_transaction_id;
    
    -- Update escrow status
    UPDATE escrow_transactions 
    SET status = 'released',
        released_at = NOW()
    WHERE transaction_id = v_transaction_record.id;
    
    -- Add to seller's payment history
    INSERT INTO user_payment_history (user_id, transaction_id, type, amount, currency_id, description)
    VALUES (
        v_transaction_record.seller_id,
        v_transaction_record.id,
        'payout',
        v_transaction_record.seller_amount,
        v_transaction_record.currency_id,
        'Escrow funds released for job completion'
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to process refund
CREATE OR REPLACE FUNCTION process_refund(
    p_transaction_id VARCHAR(100),
    p_refund_reason TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_transaction_record RECORD;
BEGIN
    -- Get transaction details
    SELECT t.*, e.id as escrow_id 
    INTO v_transaction_record
    FROM transactions t
    JOIN escrow_transactions e ON t.id = e.transaction_id
    WHERE t.transaction_id = p_transaction_id;
    
    -- Update transaction status
    UPDATE transactions 
    SET status = 'refunded', 
        escrow_status = 'refunded',
        refund_reason = p_refund_reason,
        updated_at = NOW()
    WHERE transaction_id = p_transaction_id;
    
    -- Update escrow status
    UPDATE escrow_transactions 
    SET status = 'refunded'
    WHERE transaction_id = v_transaction_record.id;
    
    -- Add to buyer's payment history
    INSERT INTO user_payment_history (user_id, transaction_id, type, amount, currency_id, description)
    VALUES (
        v_transaction_record.user_id,
        v_transaction_record.id,
        'refund',
        v_transaction_record.amount,
        v_transaction_record.currency_id,
        'Refund processed: ' || p_refund_reason
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
