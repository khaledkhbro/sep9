-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'verification-documents', 
  'verification-documents', 
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
);

-- Storage policies for verification documents
CREATE POLICY "Users can upload their verification documents" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can view their own verification documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all verification documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'verification-documents' 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('super_admin', 'manager', 'support')
  )
);

CREATE POLICY "Users can delete their own verification documents" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update verification_requests table to include file metadata
ALTER TABLE verification_requests 
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS original_filename TEXT;
