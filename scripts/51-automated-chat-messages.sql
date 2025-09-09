-- Automated Chat Messages System
-- This creates tables for managing automated messages in the anonymous chat system

-- Automated message templates
CREATE TABLE IF NOT EXISTS automated_message_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'welcome', 'proactive', 'follow_up', 'closing'
  trigger_condition VARCHAR(100) NOT NULL, -- 'session_start', 'idle_5min', 'no_response_10min', etc.
  message_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  delay_seconds INTEGER DEFAULT 0, -- Delay before sending message
  variables JSONB DEFAULT '{}', -- Dynamic variables for message content
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Automated message logs (track sent messages)
CREATE TABLE IF NOT EXISTS automated_message_logs (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  template_id INTEGER REFERENCES automated_message_templates(id),
  message_content TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  trigger_type VARCHAR(50) NOT NULL,
  success BOOLEAN DEFAULT true
);

-- Chat automation settings
CREATE TABLE IF NOT EXISTS chat_automation_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default automated message templates
INSERT INTO automated_message_templates (name, type, trigger_condition, message_content, delay_seconds, variables) VALUES
('Welcome Message', 'welcome', 'session_start', 'Hello! 👋 Welcome to our support chat. How can we help you today?', 2, '{}'),
('Idle Follow-up', 'proactive', 'idle_5min', 'Are you still there? If you need any assistance, feel free to ask!', 0, '{}'),
('No Response Follow-up', 'follow_up', 'no_response_10min', 'We noticed you haven''t responded yet. Is there anything specific you''d like help with?', 0, '{}'),
('Business Hours Notice', 'proactive', 'outside_hours', 'Thanks for reaching out! Our team is currently offline, but we''ll respond as soon as possible during business hours (9 AM - 6 PM EST).', 5, '{}'),
('Queue Position Update', 'proactive', 'queue_position', 'You are currently #{{position}} in the queue. Average wait time is {{wait_time}} minutes.', 0, '{"position": 1, "wait_time": 3}'),
('Agent Assignment', 'proactive', 'agent_assigned', 'Great news! {{agent_name}} from our support team will be assisting you shortly.', 0, '{"agent_name": "Support Agent"}'),
('Session Closing', 'closing', 'session_end', 'Thank you for contacting us! If you need further assistance, feel free to start a new chat anytime.', 0, '{}');

-- Insert default automation settings
INSERT INTO chat_automation_settings (setting_key, setting_value, description) VALUES
('welcome_message_enabled', 'true', 'Enable automatic welcome messages'),
('proactive_messages_enabled', 'true', 'Enable proactive messages for idle users'),
('business_hours_start', '09:00', 'Business hours start time (24h format)'),
('business_hours_end', '18:00', 'Business hours end time (24h format)'),
('business_days', 'monday,tuesday,wednesday,thursday,friday', 'Business days (comma-separated)'),
('idle_timeout_minutes', '5', 'Minutes before sending idle message'),
('no_response_timeout_minutes', '10', 'Minutes before sending no-response follow-up'),
('max_proactive_messages', '3', 'Maximum proactive messages per session'),
('queue_update_interval_minutes', '2', 'Minutes between queue position updates'),
('auto_close_timeout_minutes', '30', 'Minutes of inactivity before auto-closing session');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_automated_message_templates_type ON automated_message_templates(type);
CREATE INDEX IF NOT EXISTS idx_automated_message_templates_active ON automated_message_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_automated_message_logs_session ON automated_message_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_automated_message_logs_sent_at ON automated_message_logs(sent_at);
