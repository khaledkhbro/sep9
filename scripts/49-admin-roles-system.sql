-- Admin Roles & Permissions System
-- Add role column to admins table and create role-based permissions

-- Add role column to existing admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'support';

-- Update existing admins to have super_admin role (assuming first admin should be super admin)
UPDATE admins SET role = 'super_admin' WHERE id = (SELECT MIN(id) FROM admins);

-- Create admin permissions table for granular control
CREATE TABLE IF NOT EXISTS admin_permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    permission VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, permission)
);

-- Insert default permissions for each role
INSERT INTO admin_permissions (role, permission) VALUES
-- SUPER_ADMIN permissions (full access)
('super_admin', 'manage_users'),
('super_admin', 'manage_jobs'),
('super_admin', 'manage_payments'),
('super_admin', 'manage_settings'),
('super_admin', 'manage_admins'),
('super_admin', 'view_analytics'),
('super_admin', 'manage_categories'),
('super_admin', 'manage_disputes'),
('super_admin', 'system_settings'),

-- MANAGER permissions (limited admin access)
('manager', 'manage_users'),
('manager', 'manage_jobs'),
('manager', 'view_analytics'),
('manager', 'manage_categories'),
('manager', 'manage_disputes'),

-- SUPPORT permissions (support only)
('support', 'view_users'),
('support', 'manage_disputes'),
('support', 'view_jobs');

-- Create admin activity log
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(id),
    action VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_permissions_role ON admin_permissions(role);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at);
