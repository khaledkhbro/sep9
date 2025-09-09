-- Create essential tables for basic functionality
-- This creates the minimum required tables to get the app working

-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    user_type TEXT DEFAULT 'worker',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    user_id TEXT REFERENCES users(id),
    budget DECIMAL(10,2),
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) DEFAULT 0,
    deposit_balance DECIMAL(10,2) DEFAULT 0,
    earnings_balance DECIMAL(10,2) DEFAULT 0,
    pending_balance DECIMAL(10,2) DEFAULT 0,
    total_earned DECIMAL(10,2) DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    upcoming_payments DECIMAL(10,2) DEFAULT 0,
    pending_payments DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid()::text = id);

-- Create RLS policies for categories
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);

-- Create RLS policies for jobs
CREATE POLICY "Jobs are viewable by everyone" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Users can create jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own jobs" ON public.jobs FOR UPDATE USING (auth.uid()::text = user_id);

-- Create RLS policies for user_favorites
CREATE POLICY "Users can view own favorites" ON public.user_favorites FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can create own favorites" ON public.user_favorites FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own favorites" ON public.user_favorites FOR DELETE USING (auth.uid()::text = user_id);

-- Create RLS policies for wallets
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can update own wallet" ON public.wallets FOR UPDATE USING (auth.uid()::text = user_id);

-- Insert sample categories
INSERT INTO public.categories (name, description, icon) VALUES
('Web Development', 'Website and web application development', '💻'),
('Graphic Design', 'Logo, banner, and graphic design services', '🎨'),
('Writing & Translation', 'Content writing and translation services', '✍️')
ON CONFLICT DO NOTHING;

-- Insert sample user (for testing)
INSERT INTO public.users (id, email, full_name, user_type) VALUES
('02', 'worker1@marketplace.com', 'Test Worker', 'worker')
ON CONFLICT DO NOTHING;

-- Insert sample wallet for test user
INSERT INTO public.wallets (id, user_id, balance, deposit_balance, earnings_balance, pending_balance, total_earned, total_spent, upcoming_payments, pending_payments) VALUES
('wallet_02', '02', 1500.75, 1000, 500.75, 150, 2500, 800, 200, 75)
ON CONFLICT DO NOTHING;

-- Insert sample jobs
INSERT INTO public.jobs (title, description, category_id, user_id, budget, status) VALUES
('Build a Landing Page', 'Need a modern landing page for my startup', 1, '02', 500.00, 'open'),
('Design a Logo', 'Looking for a creative logo design', 2, '02', 150.00, 'open'),
('Write Product Descriptions', 'Need compelling product descriptions', 3, '02', 200.00, 'open')
ON CONFLICT DO NOTHING;
