-- Essential tables for the microjob marketplace
-- This creates the minimum required tables to get the app working

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  user_type TEXT DEFAULT 'worker' CHECK (user_type IN ('worker', 'employer', 'admin')),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS policies for users
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  parent_id UUID REFERENCES public.categories(id),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequential_id SERIAL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  employer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  deadline TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  skills_required TEXT[],
  location TEXT,
  is_remote BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for jobs
CREATE POLICY "Anyone can view active jobs" ON public.jobs
  FOR SELECT USING (status = 'open' OR employer_id = auth.uid());

CREATE POLICY "Employers can manage their own jobs" ON public.jobs
  FOR ALL USING (employer_id = auth.uid());

-- User favorites table
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- Enable RLS on user_favorites table
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_favorites
CREATE POLICY "Users can view their own favorites" ON public.user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" ON public.user_favorites
  FOR ALL USING (auth.uid() = user_id);

-- Wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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

-- Enable RLS on wallets table
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- RLS policies for wallets
CREATE POLICY "Users can view their own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert some sample categories
INSERT INTO public.categories (name, slug, description, icon) VALUES
  ('Web Development', 'web-development', 'Frontend and backend web development services', '💻'),
  ('Mobile Development', 'mobile-development', 'iOS and Android app development', '📱'),
  ('Design & Creative', 'design-creative', 'Graphic design, UI/UX, and creative services', '🎨'),
  ('Writing & Translation', 'writing-translation', 'Content writing, copywriting, and translation services', '✍️'),
  ('Digital Marketing', 'digital-marketing', 'SEO, social media, and online marketing services', '📈')
ON CONFLICT (slug) DO NOTHING;

-- Create sample wallet for existing user
INSERT INTO public.wallets (id, user_id, balance, deposit_balance, earnings_balance, pending_balance, total_earned, total_spent, upcoming_payments, pending_payments, created_at, updated_at)
VALUES ('wallet_02', '02', 1500.75, 1000, 500.75, 150, 2500, 800, 200, 75, '2024-01-01T00:00:00Z', NOW())
ON CONFLICT (id) DO NOTHING;
