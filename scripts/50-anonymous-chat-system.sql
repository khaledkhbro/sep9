-- Anonymous Chat System Database Schema
-- This creates tables for the anonymous marketplace chat system v0

-- Anonymous chat sessions table - stores temporary chat sessions
CREATE TABLE IF NOT EXISTS anonymous_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL, -- Temporary session identifier
    user_ip INET, -- For location tracking (auto-deleted after 2 days)
    user_agent TEXT, -- Browser info for analytics
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'expired')),
    agent_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Assigned agent
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '2 days'),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Anonymous messages table - stores temporary messages
CREATE TABLE IF NOT EXISTS anonymous_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL REFERENCES anonymous_chat_sessions(session_id) ON DELETE CASCADE,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'agent', 'system')),
    agent_id UUID REFERENCES users(id) ON DELETE SET NULL, -- If sent by agent
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'automated', 'welcome')),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '2 days')
);

-- Automated message templates table
CREATE TABLE IF NOT EXISTS automated_message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    message_type VARCHAR(20) DEFAULT 'automated' CHECK (message_type IN ('welcome', 'automated', 'followup')),
    content TEXT NOT NULL,
    delay_seconds INTEGER DEFAULT 0, -- Delay before sending (0 for immediate)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification settings table
CREATE TABLE IF NOT EXISTS chat_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_name VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- FCM tokens table (temporary storage)
CREATE TABLE IF NOT EXISTS anonymous_fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL REFERENCES anonymous_chat_sessions(session_id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '2 days')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_session_id ON anonymous_chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_expires_at ON anonymous_chat_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_anonymous_messages_session_id ON anonymous_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_messages_expires_at ON anonymous_messages(expires_at);
CREATE INDEX IF NOT EXISTS idx_anonymous_messages_created_at ON anonymous_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_session_id ON anonymous_fcm_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_expires_at ON anonymous_fcm_tokens(expires_at);

-- Function to clean up expired data (runs via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_anonymous_data()
RETURNS void AS $$
BEGIN
    -- Delete expired messages
    DELETE FROM anonymous_messages WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Delete expired FCM tokens
    DELETE FROM anonymous_fcm_tokens WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Delete expired sessions
    DELETE FROM anonymous_chat_sessions WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Log cleanup
    RAISE NOTICE 'Cleaned up expired anonymous chat data at %', CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_activity when new message is added
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE anonymous_chat_sessions 
    SET last_activity = CURRENT_TIMESTAMP 
    WHERE session_id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_activity_trigger 
    AFTER INSERT ON anonymous_messages
    FOR EACH ROW EXECUTE FUNCTION update_session_activity();

-- Insert default automated message templates
INSERT INTO automated_message_templates (name, message_type, content, delay_seconds, is_active) VALUES
('welcome_message', 'welcome', 'Hi there! 👋 Welcome to our marketplace. How can we help you today?', 0, true),
('followup_10s', 'followup', 'Still there? Feel free to ask any questions about our services!', 10, true),
('followup_60s', 'followup', 'Need help finding something specific? Our team is here to assist you.', 60, true)
ON CONFLICT DO NOTHING;

-- Insert default notification settings
INSERT INTO chat_notification_settings (setting_name, setting_value, is_enabled) VALUES
('telegram_bot_token', '', false),
('telegram_chat_id', '', false),
('whatsapp_api_key', '', false),
('whatsapp_phone_number', '', false),
('facebook_page_token', '', false),
('facebook_page_id', '', false),
('fcm_server_key', '', false),
('notifications_enabled', 'true', true)
ON CONFLICT (setting_name) DO NOTHING;
