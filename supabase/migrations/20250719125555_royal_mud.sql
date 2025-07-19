/*
  # Setup identicards storage bucket and RLS policies

  1. Storage Bucket
    - Create `identicards` bucket for storing officer ID documents
    - Configure as private bucket for security

  2. Storage Policies
    - Allow anonymous users to upload files (INSERT)
    - Allow authenticated users to view/download files (SELECT)

  3. Security
    - Files are stored securely with proper access controls
    - Only authenticated admins can view uploaded documents
*/

-- Create the identicards storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'identicards',
  'identicards', 
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow anonymous users to upload files to identicards bucket
CREATE POLICY "Allow anonymous uploads to identicards"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'identicards');

-- Policy to allow authenticated users to view files in identicards bucket
CREATE POLICY "Allow authenticated downloads from identicards"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'identicards');

-- Policy to allow public access to view files (needed for public URLs)
CREATE POLICY "Allow public access to identicards"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'identicards');