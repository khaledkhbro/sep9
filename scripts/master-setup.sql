-- Master Setup Script for Microjob Marketplace
-- This script runs all database setup scripts in the correct order
-- Run this single script to set up the entire database schema

-- Core Database Structure
\i scripts/01-create-tables.sql
\i scripts/02-create-indexes.sql
\i scripts/03-seed-categories.sql

-- Chat System
\i scripts/04-create-chat-tables.sql
\i scripts/05-create-chat-indexes.sql

-- Category Management
\i scripts/06-create-category-management.sql
\i scripts/07-seed-microjob-categories.sql
\i scripts/08-seed-fake-microjobs.sql

-- Workflow and Payment Systems
\i scripts/09-workflow-schema-updates.sql
\i scripts/10-wallet-system-updates.sql
\i scripts/11-currency-language-system.sql
\i scripts/12-chat-money-transfer-system.sql
\i scripts/13-instant-payment-workflow.sql

-- Pricing and Job Management
\i scripts/14-screenshot-pricing-system.sql
\i scripts/15-create-test-jobs-with-subcategories.sql
\i scripts/16-add-sequential-job-ids.sql
\i scripts/17-platform-fee-settings.sql
\i scripts/18-job-reservation-system.sql

-- Admin and Settings
\i scripts/19-admin-settings-table.sql
\i scripts/20-fix-missing-tables.sql
\i scripts/21-enhanced-revision-settings.sql
\i scripts/22-ensure-support-pricing-table.sql
\i scripts/23-add-transaction-constraints.sql

-- Advanced Features
\i scripts/24-create-favorites-system.sql
\i scripts/25-enhanced-referral-system.sql
\i scripts/26-oauth-provider-settings.sql
\i scripts/27-oauth-api-functions.sql
\i scripts/28-ad-network-settings.sql
\i scripts/29-analytics-settings.sql
\i scripts/30-server-monitoring-schema.sql
\i scripts/31-sample-achievements.sql
\i scripts/32-firebase-fcm-system.sql
\i scripts/33-marketplace-reviews-system.sql
\i scripts/34-earnings-news-system.sql
\i scripts/35-earnings-news-restriction-mode.sql
\i scripts/36-email-management-system.sql
\i scripts/37-user-settings-table.sql
\i scripts/38-add-review-moderation.sql
\i scripts/39-marketplace-algorithm-settings.sql
\i scripts/40-microjob-algorithm-settings.sql
\i scripts/41-add-rotation-tracking-constraints.sql
\i scripts/41-fix-algorithm-constraints.sql
\i scripts/42-three-level-marketplace-categories.sql
\i scripts/43-populate-fiverr-micro-categories.sql
\i scripts/44-create-public-seller-profiles.sql
\i scripts/45-payment-gateway-settings.sql
\i scripts/46-comprehensive-payment-system.sql
\i scripts/47-payment-system-functions.sql
\i scripts/48-enhanced-webhook-system.sql

-- Additional System Tables
\i scripts/create-referral-system-tables.sql
\i scripts/create-achievements-system.sql
\i scripts/create-referrals-system.sql
\i scripts/create-referral-settings-table.sql
\i scripts/create-sample-microjobs.sql
\i scripts/create-user-favorites-table.sql

-- Apply any existing fixes
\i scripts/fix-admin-settings-table.sql
\i scripts/fix-refund-processing-issues.sql

-- Final message
SELECT 'Database setup completed successfully!' as status;
