-- Enhanced Role-Based Access Control System
-- Supports custom roles and granular permissions

-- Drop existing constraints and recreate with flexible system
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_admin_role_check;

-- Create roles table for custom roles
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(20) DEFAULT 'bg-gray-100 text-gray-800',
  is_system_role BOOLEAN DEFAULT false, -- true for super_admin, manager, support
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- users, jobs, disputes, system, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS admin_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES admin_roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES admin_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Insert system roles
INSERT INTO admin_roles (name, display_name, description, color, is_system_role) VALUES
('super_admin', 'Super Admin', 'Full system access and control', 'bg-red-100 text-red-800', true),
('manager', 'Manager', 'User and job management', 'bg-blue-100 text-blue-800', true),
('support', 'Support', 'Limited dispute resolution', 'bg-green-100 text-green-800', true)
ON CONFLICT (name) DO NOTHING;

-- Insert all available permissions
INSERT INTO admin_permissions (name, display_name, description, category) VALUES
-- User Management
('users.view', 'View Users', 'View user profiles and information', 'users'),
('users.edit', 'Edit Users', 'Modify user profiles and settings', 'users'),
('users.delete', 'Delete Users', 'Remove users from the system', 'users'),
('users.ban', 'Ban Users', 'Ban/unban user accounts', 'users'),

-- Job Management
('jobs.view', 'View Jobs', 'View all jobs and listings', 'jobs'),
('jobs.edit', 'Edit Jobs', 'Modify job details and status', 'jobs'),
('jobs.delete', 'Delete Jobs', 'Remove jobs from the system', 'jobs'),
('jobs.feature', 'Feature Jobs', 'Feature/unfeature job listings', 'jobs'),

-- Dispute Management
('disputes.view', 'View Disputes', 'View dispute cases', 'disputes'),
('disputes.handle', 'Handle Disputes', 'Resolve and manage disputes', 'disputes'),
('disputes.escalate', 'Escalate Disputes', 'Escalate disputes to higher level', 'disputes'),

-- Financial Management
('transactions.view', 'View Transactions', 'View payment transactions', 'financial'),
('transactions.refund', 'Process Refunds', 'Process refunds and chargebacks', 'financial'),
('wallet.manage', 'Manage Wallets', 'Manage user wallet balances', 'financial'),

-- System Administration
('admin.create', 'Create Admins', 'Create new admin accounts', 'system'),
('admin.roles', 'Manage Roles', 'Create and modify admin roles', 'system'),
('admin.permissions', 'Manage Permissions', 'Assign permissions to roles', 'system'),
('system.settings', 'System Settings', 'Modify system configuration', 'system'),
('system.analytics', 'View Analytics', 'Access system analytics and reports', 'system'),

-- Content Management
('categories.manage', 'Manage Categories', 'Create and modify job categories', 'content'),
('content.moderate', 'Moderate Content', 'Review and moderate user content', 'content'),
('announcements.manage', 'Manage Announcements', 'Create system announcements', 'content'),

-- Support Management
('support.tickets', 'Support Tickets', 'Handle customer support tickets', 'support'),
('support.chat', 'Support Chat', 'Access support chat system', 'support'),
('support.knowledge', 'Knowledge Base', 'Manage help articles and FAQ', 'support')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to system roles
DO $$
DECLARE
    super_admin_id UUID;
    manager_id UUID;
    support_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO super_admin_id FROM admin_roles WHERE name = 'super_admin';
    SELECT id INTO manager_id FROM admin_roles WHERE name = 'manager';
    SELECT id INTO support_id FROM admin_roles WHERE name = 'support';
    
    -- Super Admin gets all permissions
    INSERT INTO admin_role_permissions (role_id, permission_id)
    SELECT super_admin_id, id FROM admin_permissions
    ON CONFLICT DO NOTHING;
    
    -- Manager permissions
    INSERT INTO admin_role_permissions (role_id, permission_id)
    SELECT manager_id, id FROM admin_permissions 
    WHERE name IN (
        'users.view', 'users.edit', 'users.ban',
        'jobs.view', 'jobs.edit', 'jobs.feature',
        'disputes.view', 'disputes.handle',
        'transactions.view', 'system.analytics',
        'categories.manage', 'content.moderate'
    )
    ON CONFLICT DO NOTHING;
    
    -- Support permissions
    INSERT INTO admin_role_permissions (role_id, permission_id)
    SELECT support_id, id FROM admin_permissions 
    WHERE name IN (
        'disputes.view', 'disputes.handle',
        'support.tickets', 'support.chat', 'support.knowledge'
    )
    ON CONFLICT DO NOTHING;
END $$;

-- Update users table to reference roles table
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_role_id UUID REFERENCES admin_roles(id);

-- Migrate existing admin_role data
DO $$
BEGIN
    UPDATE users SET admin_role_id = (SELECT id FROM admin_roles WHERE name = users.admin_role)
    WHERE admin_role IS NOT NULL;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_roles_name ON admin_roles(name);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_category ON admin_permissions(category);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON admin_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_users_admin_role_id ON users(admin_role_id);
