-- Essential tables for favorites functionality
-- Based on Supabase integration examples with proper RLS

-- Create users table that references auth.users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS policies for users table
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_delete_own" ON public.users FOR DELETE USING (auth.uid() = id);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on categories (public read access)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select_all" ON public.categories FOR SELECT TO authenticated USING (true);

-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for jobs table
CREATE POLICY "jobs_select_all" ON public.jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "jobs_insert_own" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "jobs_update_own" ON public.jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "jobs_delete_own" ON public.jobs FOR DELETE USING (auth.uid() = user_id);

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- Enable RLS on user_favorites table
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_favorites table
CREATE POLICY "favorites_select_own" ON public.user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert_own" ON public.user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete_own" ON public.user_favorites FOR DELETE USING (auth.uid() = user_id);

-- Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- RLS policies for wallets table
CREATE POLICY "wallets_select_own" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wallets_insert_own" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wallets_update_own" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);

-- Insert sample categories
INSERT INTO public.categories (name, description, icon) VALUES
('Web Development', 'Website and web application development', '💻'),
('Graphic Design', 'Logo, branding, and visual design services', '🎨'),
('Writing & Translation', 'Content writing and translation services', '✍️')
ON CONFLICT DO NOTHING;

-- Create trigger function to auto-create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Create wallet for new user
  INSERT INTO public.wallets (id, user_id, balance, deposit_balance, earnings_balance)
  VALUES (
    'wallet_' || SUBSTRING(NEW.id::text FROM 1 FOR 8),
    NEW.id,
    1500.75,
    1000,
    500.75
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
