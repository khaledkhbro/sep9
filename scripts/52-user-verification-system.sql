-- User ID Verification System Database Schema
-- Creates tables for document verification requests and admin settings

-- Create verification_settings table for admin to manage document types
CREATE TABLE IF NOT EXISTS verification_settings (
    id SERIAL PRIMARY KEY,
    document_type VARCHAR(100) NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT true,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    max_file_size_mb INTEGER DEFAULT 5,
    allowed_formats TEXT[] DEFAULT ARRAY['jpg', 'jpeg', 'png', 'pdf'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create verification_requests table for user submissions
CREATE TABLE IF NOT EXISTS verification_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure user can only have one active request per document type
    UNIQUE(user_id, document_type, status) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_document_type ON verification_requests(document_type);
CREATE INDEX IF NOT EXISTS idx_verification_requests_created_at ON verification_requests(created_at DESC);

-- Create user_verification_status table to track overall verification status
CREATE TABLE IF NOT EXISTS user_verification_status (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    is_verified BOOLEAN DEFAULT false,
    verified_document_type VARCHAR(100),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_level VARCHAR(50) DEFAULT 'none' CHECK (verification_level IN ('none', 'basic', 'premium')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default document types
INSERT INTO verification_settings (document_type, display_name, description, enabled) VALUES
('student_id', 'Student ID Card', 'Valid student identification card from educational institution', true),
('national_id', 'National ID Card', 'Government issued national identification card', true),
('driving_license', 'Driving License', 'Valid driving license issued by government authority', true),
('passport', 'Passport', 'Valid passport issued by government', true),
('voter_id', 'Voter ID Card', 'Government issued voter identification card', false),
('employee_id', 'Employee ID Card', 'Company issued employee identification card', false)
ON CONFLICT (document_type) DO NOTHING;

-- Create function to update user verification status
CREATE OR REPLACE FUNCTION update_user_verification_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If request is approved, update user verification status
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        INSERT INTO user_verification_status (user_id, is_verified, verified_document_type, verified_at, verification_level)
        VALUES (NEW.user_id, true, NEW.document_type, NOW(), 'basic')
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            is_verified = true,
            verified_document_type = NEW.document_type,
            verified_at = NOW(),
            verification_level = 'basic',
            updated_at = NOW();
    END IF;
    
    -- If request is rejected or pending, check if user has any other approved requests
    IF NEW.status IN ('rejected', 'pending') THEN
        -- Check if user has any other approved verification
        IF NOT EXISTS (
            SELECT 1 FROM verification_requests 
            WHERE user_id = NEW.user_id AND status = 'approved' AND id != NEW.id
        ) THEN
            INSERT INTO user_verification_status (user_id, is_verified, verification_level)
            VALUES (NEW.user_id, false, 'none')
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                is_verified = false,
                verified_document_type = NULL,
                verified_at = NULL,
                verification_level = 'none',
                updated_at = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update user verification status
DROP TRIGGER IF EXISTS trigger_update_user_verification_status ON verification_requests;
CREATE TRIGGER trigger_update_user_verification_status
    AFTER UPDATE ON verification_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_user_verification_status();

-- Create RLS policies for security
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verification_status ENABLE ROW LEVEL SECURITY;

-- Users can only see their own verification requests
CREATE POLICY "Users can view own verification requests" ON verification_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own verification requests
CREATE POLICY "Users can create own verification requests" ON verification_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending requests (for resubmission)
CREATE POLICY "Users can update own pending requests" ON verification_requests
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Admin policies (will be refined based on admin role system)
CREATE POLICY "Admins can manage all verification requests" ON verification_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' IN ('super_admin', 'manager')
        )
    );

-- Everyone can read verification settings (to show available document types)
CREATE POLICY "Anyone can read verification settings" ON verification_settings
    FOR SELECT USING (true);

-- Only admins can manage verification settings
CREATE POLICY "Admins can manage verification settings" ON verification_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' IN ('super_admin', 'manager')
        )
    );

-- Users can view their own verification status
CREATE POLICY "Users can view own verification status" ON user_verification_status
    FOR SELECT USING (auth.uid() = user_id);

-- System can insert/update verification status
CREATE POLICY "System can manage verification status" ON user_verification_status
    FOR ALL USING (true);

-- Add helpful comments
COMMENT ON TABLE verification_requests IS 'Stores user document verification requests for manual admin review';
COMMENT ON TABLE verification_settings IS 'Admin configurable document types and their settings';
COMMENT ON TABLE user_verification_status IS 'Tracks overall verification status for each user';
