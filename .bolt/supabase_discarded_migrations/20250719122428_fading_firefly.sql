/*
  # Fix RLS policies for officer registrations

  1. Security Changes
    - Add policy for anonymous users to insert registration requests
    - Add policy for authenticated users (admins) to read all registrations
    - Add policy for authenticated users (admins) to update registration status
    - Ensure RLS is properly enabled

  This allows:
  - Anonymous users to submit registration requests (INSERT with status = 'pending')
  - Authenticated admin users to view and manage all registrations
  - Maintains security by restricting what anonymous users can do
*/

-- Ensure RLS is enabled
ALTER TABLE officer_registrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous registration submissions" ON officer_registrations;
DROP POLICY IF EXISTS "Allow admins to read all registrations" ON officer_registrations;
DROP POLICY IF EXISTS "Allow admins to update registrations" ON officer_registrations;

-- Policy 1: Allow anonymous users to insert registration requests
CREATE POLICY "Allow anonymous registration submissions"
  ON officer_registrations
  FOR INSERT
  TO anon
  WITH CHECK (status = 'pending');

-- Policy 2: Allow authenticated users (admins) to read all registrations
CREATE POLICY "Allow admins to read all registrations"
  ON officer_registrations
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 3: Allow authenticated users (admins) to update registrations
CREATE POLICY "Allow admins to update registrations"
  ON officer_registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);