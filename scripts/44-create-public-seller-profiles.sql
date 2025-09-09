-- Public seller profile settings
CREATE TABLE IF NOT EXISTS public_seller_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Profile visibility settings
    is_public BOOLEAN DEFAULT TRUE,
    show_full_name BOOLEAN DEFAULT TRUE,
    show_location BOOLEAN DEFAULT TRUE,
    show_bio BOOLEAN DEFAULT TRUE,
    show_skills BOOLEAN DEFAULT TRUE,
    show_rating BOOLEAN DEFAULT TRUE,
    show_reviews BOOLEAN DEFAULT TRUE,
    show_total_orders BOOLEAN DEFAULT TRUE,
    show_member_since BOOLEAN DEFAULT TRUE,
    
    -- Earnings display settings
    show_earnings BOOLEAN DEFAULT FALSE,
    show_total_earnings BOOLEAN DEFAULT FALSE,
    show_yearly_earnings BOOLEAN DEFAULT FALSE,
    show_monthly_earnings BOOLEAN DEFAULT FALSE,
    show_last_month_earnings BOOLEAN DEFAULT FALSE,
    
    -- Additional profile settings
    show_response_time BOOLEAN DEFAULT TRUE,
    show_last_active BOOLEAN DEFAULT TRUE,
    show_hourly_rate BOOLEAN DEFAULT FALSE,
    custom_hourly_rate DECIMAL(10,2), -- Override if different from general rate
    
    -- Profile customization
    profile_title VARCHAR(255), -- Custom title like "Professional Video Editor"
    profile_tagline VARCHAR(500), -- Short description/tagline
    custom_bio TEXT, -- Extended bio for public profile
    
    -- Social links
    website_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    twitter_url VARCHAR(500),
    instagram_url VARCHAR(500),
    youtube_url VARCHAR(500),
    
    -- SEO and sharing
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    custom_slug VARCHAR(100) UNIQUE, -- Custom URL slug like /seller/john-doe
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Portfolio items for showcasing work
CREATE TABLE IF NOT EXISTS seller_portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id),
    
    -- Media files
    images TEXT[] DEFAULT '{}', -- Array of image URLs
    video_url VARCHAR(500),
    
    -- Project details
    project_url VARCHAR(500), -- Link to live project
    technologies_used TEXT[], -- Array of technologies/tools
    completion_date DATE,
    
    -- Display settings
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track profile views for analytics
CREATE TABLE IF NOT EXISTS seller_profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous views
    
    -- View details
    ip_address INET,
    user_agent TEXT,
    referrer_url VARCHAR(500),
    
    -- Geographic data (optional)
    country VARCHAR(100),
    city VARCHAR(100),
    
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate counting (same user/IP within 24 hours)
    UNIQUE(seller_id, viewer_id, DATE(viewed_at)),
    UNIQUE(seller_id, ip_address, DATE(viewed_at))
);

-- Seller achievements/badges system
CREATE TABLE IF NOT EXISTS seller_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    achievement_type VARCHAR(50) NOT NULL, -- 'top_seller', 'fast_delivery', 'quality_work', etc.
    achievement_name VARCHAR(255) NOT NULL,
    achievement_description TEXT,
    achievement_icon VARCHAR(100), -- Icon identifier
    
    -- Achievement criteria
    criteria_met JSONB, -- Store the criteria that was met
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Display settings
    is_visible BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seller statistics for public display
CREATE TABLE IF NOT EXISTS seller_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Order statistics
    total_orders_completed INTEGER DEFAULT 0,
    orders_in_progress INTEGER DEFAULT 0,
    orders_this_month INTEGER DEFAULT 0,
    orders_last_month INTEGER DEFAULT 0,
    
    -- Earnings statistics (stored in cents for precision)
    total_earnings_cents BIGINT DEFAULT 0,
    earnings_this_year_cents BIGINT DEFAULT 0,
    earnings_this_month_cents BIGINT DEFAULT 0,
    earnings_last_month_cents BIGINT DEFAULT 0,
    
    -- Performance metrics
    average_delivery_time_hours INTEGER DEFAULT 0,
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 100.00, -- Percentage
    repeat_customer_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
    
    -- Response metrics
    average_response_time_minutes INTEGER DEFAULT 0,
    response_rate DECIMAL(5,2) DEFAULT 100.00, -- Percentage
    
    -- Profile metrics
    profile_views_total INTEGER DEFAULT 0,
    profile_views_this_month INTEGER DEFAULT 0,
    profile_views_last_month INTEGER DEFAULT 0,
    
    -- Last activity
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_order_at TIMESTAMP WITH TIME ZONE,
    
    -- Update tracking
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_public_seller_profiles_user_id ON public_seller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_public_seller_profiles_is_public ON public_seller_profiles(is_public);
CREATE INDEX IF NOT EXISTS idx_public_seller_profiles_custom_slug ON public_seller_profiles(custom_slug);

CREATE INDEX IF NOT EXISTS idx_seller_portfolio_user_id ON seller_portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_portfolio_is_visible ON seller_portfolio(is_visible);
CREATE INDEX IF NOT EXISTS idx_seller_portfolio_is_featured ON seller_portfolio(is_featured);
CREATE INDEX IF NOT EXISTS idx_seller_portfolio_category_id ON seller_portfolio(category_id);

CREATE INDEX IF NOT EXISTS idx_seller_profile_views_seller_id ON seller_profile_views(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_profile_views_viewed_at ON seller_profile_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_seller_profile_views_viewer_id ON seller_profile_views(viewer_id);

CREATE INDEX IF NOT EXISTS idx_seller_achievements_user_id ON seller_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_achievements_type ON seller_achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_seller_achievements_visible ON seller_achievements(is_visible);

CREATE INDEX IF NOT EXISTS idx_seller_statistics_user_id ON seller_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_statistics_last_active ON seller_statistics(last_active_at);

-- Insert default public profile settings for existing users
INSERT INTO public_seller_profiles (user_id)
SELECT id FROM users 
WHERE id NOT IN (SELECT user_id FROM public_seller_profiles);

-- Insert default statistics for existing users
INSERT INTO seller_statistics (user_id)
SELECT id FROM users 
WHERE id NOT IN (SELECT user_id FROM seller_statistics);
