-- Migration: 002_storage_bucket.sql
-- Create the "vehicles" storage bucket and access policies

-- Create the bucket (public read access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicles', 'vehicles', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read files (public bucket)
CREATE POLICY "Public read access for vehicles bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicles');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload to vehicles bucket"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vehicles'
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own files
CREATE POLICY "Users can update own files in vehicles bucket"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vehicles'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'vehicles'
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files in vehicles bucket"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vehicles'
  AND auth.role() = 'authenticated'
);
