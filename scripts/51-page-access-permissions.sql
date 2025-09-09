-- Add page access permissions to the system
INSERT INTO permissions (key, name, description, category) VALUES
('page_access_dashboard', 'Dashboard Access', 'Access to admin dashboard', 'Page Access'),
('page_access_users', 'User Management Access', 'Access to user management page', 'Page Access'),
('page_access_jobs', 'Job Management Access', 'Access to job management page', 'Page Access'),
('page_access_services', 'Service Management Access', 'Access to service management page', 'Page Access'),
('page_access_orders', 'Order Management Access', 'Access to order management page', 'Page Access'),
('page_access_categories', 'Category Management Access', 'Access to category management page', 'Page Access'),
('page_access_marketplace_categories', 'Marketplace Categories Access', 'Access to marketplace categories page', 'Page Access'),
('page_access_transactions', 'Transaction Management Access', 'Access to transaction management page', 'Page Access'),
('page_access_disputes', 'Dispute Management Access', 'Access to dispute management page', 'Page Access'),
('page_access_support', 'Support Management Access', 'Access to support management page', 'Page Access'),
('page_access_chat', 'Chat Management Access', 'Access to chat management page', 'Page Access'),
('page_access_wallet', 'Wallet Management Access', 'Access to wallet management page', 'Page Access'),
('page_access_payments', 'Payment Methods Access', 'Access to payment methods page', 'Page Access'),
('page_access_referrals', 'Referral Management Access', 'Access to referral management page', 'Page Access'),
('page_access_roles', 'Role Management Access', 'Access to role management page', 'Page Access'),
('page_access_settings', 'System Settings Access', 'Access to system settings page', 'Page Access')
ON CONFLICT (key) DO NOTHING;

-- Grant super admin access to all pages
INSERT INTO role_permissions (role_id, permission_key, permission_value)
SELECT r.id, p.key, true
FROM custom_roles r, permissions p
WHERE r.name = 'super_admin' AND p.category = 'Page Access'
ON CONFLICT (role_id, permission_key) DO NOTHING;
