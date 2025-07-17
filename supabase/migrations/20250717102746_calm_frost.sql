/*
  # Combine API and API Keys Tables

  1. Schema Changes
    - Add api_key, status, usage_count, and last_used columns to apis table
    - Migrate existing data from api_keys table to apis table
    - Drop api_keys table
    - Update constraints and indexes

  2. Data Migration
    - Copy api key data to corresponding API records
    - Handle orphaned records appropriately

  3. Security
    - Maintain existing RLS policies on apis table
    - Remove policies from api_keys table before dropping
*/

-- First, add new columns to apis table
ALTER TABLE apis 
ADD COLUMN IF NOT EXISTS api_key text,
ADD COLUMN IF NOT EXISTS key_status text DEFAULT 'Inactive',
ADD COLUMN IF NOT EXISTS usage_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used timestamp with time zone;

-- Add constraint for key_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'apis_key_status_check' 
    AND table_name = 'apis'
  ) THEN
    ALTER TABLE apis ADD CONSTRAINT apis_key_status_check 
    CHECK (key_status = ANY (ARRAY['Active'::text, 'Inactive'::text]));
  END IF;
END $$;

-- Migrate data from api_keys to apis table
-- Match by name and provider
UPDATE apis 
SET 
  api_key = ak.api_key,
  key_status = ak.status,
  usage_count = ak.usage_count,
  last_used = ak.last_used
FROM api_keys ak
WHERE apis.name = ak.name 
  AND apis.service_provider = ak.provider;

-- For any APIs without matching keys, set default values
UPDATE apis 
SET 
  api_key = COALESCE(api_key, ''),
  key_status = COALESCE(key_status, 'Inactive'),
  usage_count = COALESCE(usage_count, 0)
WHERE api_key IS NULL;

-- Make api_key NOT NULL now that we have default values
ALTER TABLE apis ALTER COLUMN api_key SET NOT NULL;
ALTER TABLE apis ALTER COLUMN key_status SET NOT NULL;
ALTER TABLE apis ALTER COLUMN usage_count SET NOT NULL;

-- Add index for api_key lookups
CREATE INDEX IF NOT EXISTS idx_apis_api_key ON apis(api_key);
CREATE INDEX IF NOT EXISTS idx_apis_key_status ON apis(key_status);

-- Drop the api_keys table (this will automatically drop its policies and constraints)
DROP TABLE IF EXISTS api_keys CASCADE;

-- Update the trigger to handle the new columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure the trigger exists on apis table
DROP TRIGGER IF EXISTS update_apis_updated_at ON apis;
CREATE TRIGGER update_apis_updated_at 
    BEFORE UPDATE ON apis 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();